import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobberJobsService } from '../../jobber/jobber/jobber-jobs.service';
import { TagsService } from '../../tags/tags/tags.service';
import { AuthService } from '../../auth/auth.service';
import { JobberOAuthService } from '../../auth/jobber/jobber-oauth.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private jobberJobsService: JobberJobsService,
    private tagsService: TagsService,
    private authService: AuthService,
    private jobberOAuthService: JobberOAuthService,
  ) {}

  private async getAccessTokenForWebhook(webhookPayload: any): Promise<string | undefined> {
    try {
      // Try to get accountId from webhook payload
      const accountId =
        webhookPayload.data?.webHookEvent?.accountId ||
        webhookPayload.accountId ||
        webhookPayload.data?.accountId;

      if (!accountId) {
        this.logger.warn('Webhook payload missing accountId; cannot resolve user-specific token.');
        return undefined; // Will use fallback token if configured
      }

      const user = await this.authService.getUserByAccountIdOrAttach(accountId);
      if (!user?.id) {
        this.logger.warn(
          `No connected user found for Jobber accountId ${accountId}. Please disconnect/reconnect Jobber.`,
        );
        return undefined;
      }

      // Get valid access token (will auto-refresh if needed)
      try {
        return await this.jobberOAuthService.getValidAccessToken(user.id);
      } catch (tokenError: any) {
        this.logger.error(
          `Failed to get/refresh access token for user ${user.id}: ${tokenError.message}`,
        );
        this.logger.error(
          '⚠️ The refresh token may be invalid. Please disconnect and reconnect your Jobber account in Settings.',
        );
        return undefined;
      }
    } catch (error: any) {
      this.logger.error(`Error in getAccessTokenForWebhook: ${error.message}`);
      return undefined;
    }
  }

  async handleJobCreate(webhookPayload: any) {
    try {
      this.logger.log('📥 Starting JOB_CREATE processing...');
      this.logger.log('Webhook payload structure:', JSON.stringify(webhookPayload, null, 2));
      
      const jobId = webhookPayload.data?.webHookEvent?.itemId;
      if (!jobId) {
        this.logger.error('❌ Job ID not found in webhook payload');
        this.logger.error('Payload keys:', Object.keys(webhookPayload));
        if (webhookPayload.data) {
          this.logger.error('Payload.data keys:', Object.keys(webhookPayload.data));
        }
        throw new Error('Job ID not found in webhook payload');
      }

      this.logger.log(`✅ Job ID extracted: ${jobId}`);

      // Get user-specific access token if available
      this.logger.log('🔑 Getting access token...');
      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      if (!accessToken) {
        this.logger.error(
          '❌ No valid access token available. Cannot fetch job details from Jobber.',
        );
        this.logger.error(
          '⚠️ ACTION REQUIRED: Please disconnect and reconnect your Jobber account in Settings to refresh the access token.',
        );
        this.logger.error(
          `📝 Job ID from webhook: ${jobId} - This job will be synced once you reconnect your Jobber account.`,
        );
        throw new Error(
          'No valid access token. Please disconnect and reconnect your Jobber account in Settings.',
        );
      } else {
        this.logger.log('✅ Access token obtained');
      }

      // Fetch full job data from Jobber
      this.logger.log('📡 Fetching job details from Jobber...');
      const jobberData = await this.jobberJobsService.getJobDetails(jobId, accessToken);
      this.logger.log('Jobber API response received');
      
      const jobberJob = jobberData.data?.job;

      if (!jobberJob) {
        this.logger.error('❌ Job not found in Jobber API response');
        this.logger.error('Response structure:', JSON.stringify(jobberData, null, 2));
        throw new Error('Job not found in Jobber');
      }

      this.logger.log('✅ Job data fetched from Jobber');

      // Transform to database schema
      this.logger.log('🔄 Transforming job data...');
      const jobData = this.transformJobberData(jobberJob);
      this.logger.log('✅ Job data transformed');

      // Upsert to database
      this.logger.log('💾 Saving job to database...');
      const job = await this.prisma.job.upsert({
        where: { jId: jobData.jId },
        update: jobData,
        create: jobData,
      });

      this.logger.log(`✅ Job saved to database: ${job.jId} (DB ID: ${job.id})`);

      // Generate and sync tags from job title
      const client = jobberJob.client;
      console.log('🔍 [TAGS DEBUG] Checking conditions for tag generation...');
      console.log('🔍 [TAGS DEBUG] client?.id:', client?.id);
      console.log('🔍 [TAGS DEBUG] jobberJob.title:', jobberJob.title);
      if (client?.id) {
        console.log('✅ [TAGS DEBUG] Conditions met, calling generateAndSyncTagsFromJob');
        this.logger.log('🏷️ Generating tags from job title...');
        await this.generateAndSyncTagsFromJob(jobberJob, client.id, client.emails?.[0]?.address || '');
        this.logger.log('✅ Tags generated');
      } else {
        console.log('❌ [TAGS DEBUG] Conditions not met, skipping tag generation');
        console.log('❌ [TAGS DEBUG] client?.id exists:', !!client?.id);
      }

      this.logger.log(`✅ JOB_CREATE processing completed successfully for: ${job.jId}`);
      return job;
    } catch (error) {
      this.logger.error('❌ Error handling job create:', error);
      this.logger.error('Error message:', error.message);
      this.logger.error('Error stack:', error.stack);
      throw error;
    }
  }

  async handleJobUpdate(webhookPayload: any) {
    try {
      const jobId = webhookPayload.data?.webHookEvent?.itemId;
      if (!jobId) {
        throw new Error('Job ID not found in webhook payload');
      }

      this.logger.log(`Processing JOB_UPDATE for: ${jobId}`);

      // Get user-specific access token if available
      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);

      const jobberData = await this.jobberJobsService.getJobDetails(jobId, accessToken);
      console.log('Jobber job full response:', JSON.stringify(jobberData, null, 2));
      const jobberJob = jobberData.data?.job;

      if (!jobberJob) {
        throw new Error('Job not found in Jobber');
      }

      const jobData = this.transformJobberData(jobberJob);

      const job = await this.prisma.job.upsert({
        where: { jId: jobData.jId },
        update: jobData,
        create: jobData,
      });

      // Generate and sync tags from job title
      const client = jobberJob.client;
      console.log('🔍 [TAGS DEBUG] [JOB_UPDATE] Checking conditions for tag generation...');
      console.log('🔍 [TAGS DEBUG] [JOB_UPDATE] client?.id:', client?.id);
      console.log('🔍 [TAGS DEBUG] [JOB_UPDATE] jobberJob.title:', jobberJob.title);
      if (client?.id) {
        console.log('✅ [TAGS DEBUG] [JOB_UPDATE] Conditions met, calling generateAndSyncTagsFromJob');
        await this.generateAndSyncTagsFromJob(jobberJob, client.id, client.emails?.[0]?.address || '');
      } else {
        console.log('❌ [TAGS DEBUG] [JOB_UPDATE] Conditions not met, skipping tag generation');
      }

      this.logger.log(`✅ Job updated: ${job.jId}`);
      return job;
    } catch (error) {
      this.logger.error('Error handling job update:', error);
      throw error;
    }
  }

  async handleJobDestroy(webhookPayload: any) {
    try {
      const jobId = webhookPayload.data?.webHookEvent?.itemId;
      if (!jobId) {
        throw new Error('Job ID not found in webhook payload');
      }

      this.logger.log(`Processing JOB_DESTROY for: ${jobId}`);

      // Mark as archived
      const job = await this.prisma.job.update({
        where: { jId: jobId },
        data: { jobStatus: 'archived', closedDate: new Date().toISOString().split('T')[0] },
      });

      this.logger.log(`✅ Job archived: ${job.jId}`);
      return job;
    } catch (error) {
      this.logger.error('Error handling job destroy:', error);
      throw error;
    }
  }

  async handleJobClosed(webhookPayload: any) {
    try {
      const jobId = webhookPayload.data?.webHookEvent?.itemId;
      if (!jobId) {
        throw new Error('Job ID not found in webhook payload');
      }

      this.logger.log(`Processing JOB_CLOSED for: ${jobId}`);

      // Get user-specific access token if available
      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);

      const jobberData = await this.jobberJobsService.getJobDetails(jobId, accessToken);
      const jobberJob = jobberData.data?.job;

      if (!jobberJob) {
        throw new Error('Job not found in Jobber');
      }

      const jobData = this.transformJobberData(jobberJob);
      jobData.closedDate = new Date().toISOString().split('T')[0];

      const job = await this.prisma.job.upsert({
        where: { jId: jobData.jId },
        update: jobData,
        create: jobData,
      });

      this.logger.log(`✅ Job closed: ${job.jId}`);
      return job;
    } catch (error) {
      this.logger.error('Error handling job closed:', error);
      throw error;
    }
  }

  private transformJobberData(jobberJob: any) {
    // Helper: Normalize label for matching
    const normalizeLabel = (label: string) => label?.trim().toLowerCase() || '';

    // Helper: Extract custom field value by label
    const getCustomFieldByLabel = (fields: any[], label: string): string => {
      const target = normalizeLabel(label);
      const match = (fields || []).find((f) => normalizeLabel(f?.label) === target);
      if (!match) return '';

      if (match.valueText !== undefined) return match.valueText || '';
      if (match.valueNumeric !== undefined) return String(match.valueNumeric ?? '');
      if (match.valueDropdown !== undefined) return match.valueDropdown || '';
      if (match.valueArea) {
        const { length, width } = match.valueArea;
        return [length, width].filter((v) => v !== undefined && v !== null).join('x');
      }
      if (match.valueLink) {
        const { text, url } = match.valueLink;
        return [text, url].filter(Boolean).join(' ');
      }
      return '';
    };

    // Client info
    const client = jobberJob.client || {};
    const clientName = [client.firstName, client.lastName].filter(Boolean).join(' ') || '';
    const clientEmail = client.emails?.[0]?.address || '';
    const clientPhone = client.phones?.find((p: any) => p.primary)?.number || client.phones?.[0]?.number || '';
    const clientBilling = client.billingAddress || {};

    // Salesperson info
    const salesperson = jobberJob.salesperson || {};
    const salespersonName = [salesperson.name?.first, salesperson.name?.last].filter(Boolean).join(' ') || '';

    // Property info
    const property = jobberJob.property || {};
    const propertyAddress = property.address || {};

    // Line items
    const lineItemsNodes = jobberJob.lineItems?.nodes || [];
    const formattedLineItems = lineItemsNodes
      .filter((item: any) => (item?.unitPrice ?? 0) !== 0 || (item?.totalPrice ?? 0) !== 0)
      .map((item: any) =>
        `${item?.name ?? 'Unnamed'} – qty: ${item?.qty ?? 0} – unit_price: ${item?.unitPrice ?? 0} – total_price: ${item?.totalPrice ?? 0}`
      )
      .join(', ');

    // Total calculation
    const total = lineItemsNodes
      .map((item: any) => parseFloat(item?.totalPrice || '0'))
      .reduce((sum: number, price: number) => sum + price, 0)
      .toString();

    // Invoice numbers
    const invoiceNumbers = jobberJob.invoices?.nodes
      ?.map((inv: any) => inv?.invoiceNumber || '')
      .filter(Boolean)
      .join(', ') || '';

    // Visits - extract last visit times for recurring jobs
    const visitsNodes = jobberJob.visits?.nodes || [];
    const lastVisit = visitsNodes[visitsNodes.length - 1];
    let startTime = '';
    let endTime = '';

    if (lastVisit) {
      if (lastVisit.startAt) {
        const d = new Date(lastVisit.startAt);
        d.setHours(d.getHours() - 5); // Timezone adjustment -5 hours
        startTime = d.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
      }
      if (lastVisit.endAt) {
        const d = new Date(lastVisit.endAt);
        d.setHours(d.getHours() - 5); // Timezone adjustment -5 hours
        endTime = d.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
      }
    }

    // Dates formatting
    const formatDate = (date: string | Date | null | undefined): string => {
      if (!date) return '';
      try {
        const d = date instanceof Date ? date : new Date(date);
        return d.toISOString().split('T')[0]; // yyyy-MM-dd
      } catch {
        return '';
      }
    };

    // Custom fields
    const customFields = jobberJob.customFields || [];
    const clientCustomFields = client.customFields || [];

    // Job type mapping (ONE_OFF -> ONE_TIME)
    const jobType = jobberJob.jobType === 'ONE_OFF' ? 'ONE_TIME' : jobberJob.jobType || '';

    // Recurring-specific fields
    const visitFrequency = jobberJob.visits?.totalCount?.toString() || '';
    const firstVisit = visitsNodes[0];

    return {
      jId: jobberJob.id,
      jobNumber: jobberJob.jobNumber ? String(jobberJob.jobNumber) : '',
      jobType: jobType,
      title: jobberJob.title || '',
      jobStatus: jobberJob.jobStatus || '',

      clientJId: client.id || '',
      clientName: clientName,
      clientEmail: clientEmail,
      clientPhone: clientPhone,

      servicePropertyName: property.name || lineItemsNodes[0]?.name || '',
      serviceStreet: propertyAddress.street || '',
      serviceCity: propertyAddress.city || '',
      serviceProvince: propertyAddress.province || '',
      serviceZip: propertyAddress.postalCode || '',
      serviceCountry: propertyAddress.country || '',

      billingType: jobberJob.billingType || '',
      billingStreet: clientBilling.street || propertyAddress.street || '',
      billingCity: clientBilling.city || propertyAddress.city || '',
      billingProvince: clientBilling.province || propertyAddress.province || '',
      billingZip: clientBilling.postalCode || propertyAddress.postalCode || '',
      leadSource:
        getCustomFieldByLabel(customFields, 'Lead Source') ||
        getCustomFieldByLabel(clientCustomFields, 'Lead Source') ||
        '',
      onlineBooking: getCustomFieldByLabel(customFields, 'Online Booking') || '',

      createdAt: jobberJob.createdAt ? new Date(jobberJob.createdAt) : null,
      startAt: jobberJob.startAt ? new Date(jobberJob.startAt) : null,
      endAt: jobberJob.endAt ? new Date(jobberJob.endAt) : null,
      createdDate: formatDate(jobberJob.createdAt),
      scheduleStartDate: formatDate(firstVisit?.startAt),
      scheduleEndDate: formatDate(firstVisit?.endAt),
      closedDate: '', // Set in handleJobClosed

      // Recurring-specific
      visitFrequency: visitFrequency,
      billingFrequency: '',
      automaticInvoicing: '',
      visitsAssignedTo: '',
      completedVisits: '',
      startTime: startTime,
      endTime: endTime,

      lineItemsJson: JSON.stringify(lineItemsNodes),
      lineItems: formattedLineItems,

      numberOfInvoices: invoiceNumbers,
      invoicesJson: JSON.stringify(jobberJob.invoices?.nodes || []),
      expensesTotal: '',
      timeTracked: '',
      labourCostTotal: '',
      lineItemCostTotal: '',
      totalCosts: '',
      quoteDiscount: '',
      totalRevenue: '',
      profit: '',
      profitPercent: '',

      quoteNumber: jobberJob.quote?.quoteNumber || '',

      salesperson: salespersonName,

      instructions: jobberJob.instructions || '',
      additionalInstructions: jobberJob.instructions || '', // Same as instructions for now

      // Custom Fields (Label-based mapping)
      typeOfProperty: getCustomFieldByLabel(customFields, 'Type of Property'),
      frequency: getCustomFieldByLabel(customFields, 'Frequency'),
      referredBy: getCustomFieldByLabel(customFields, 'Referred By'),
      birthdayMonth: getCustomFieldByLabel(customFields, 'Birthday Month'),
      typeOfCleaning: getCustomFieldByLabel(customFields, 'Type of Cleaning'),
      hours: getCustomFieldByLabel(customFields, 'Hours'),
      cleaningInstructions: getCustomFieldByLabel(customFields, 'Cleaning Instructions'),
      howToGetInTheHouse: getCustomFieldByLabel(customFields, 'How to get in the house'),
      detailToGetInTheHouse: getCustomFieldByLabel(customFields, 'Detail to get in the house') || getCustomFieldByLabel(customFields, 'Details to get in the house'),
      cleanInsideOfTheStove: getCustomFieldByLabel(customFields, 'Clean inside of the stove'),
      cleanInsideOfTheFridge: getCustomFieldByLabel(customFields, 'Clean inside of the fridge'),
      windowsToBeCleaned: getCustomFieldByLabel(customFields, 'Windows to be cleaned'),
      glassDoorsToBeCleaned: getCustomFieldByLabel(customFields, 'Glass doors to be cleaned'),
      typerOfProductsToUse: getCustomFieldByLabel(customFields, 'Typer of products to use') || getCustomFieldByLabel(customFields, 'typer of products to use'),
      squareFoot: getCustomFieldByLabel(customFields, 'Square Foot'),
      exactSqFt: getCustomFieldByLabel(customFields, 'Exact SqFt') || getCustomFieldByLabel(customFields, 'Exact sqft'),
      zone: getCustomFieldByLabel(customFields, 'Zone'),
      parkingDetails: getCustomFieldByLabel(customFields, 'Parking details'),
      responsibidProfile: getCustomFieldByLabel(customFields, 'ResponsiBid Profile') || getCustomFieldByLabel(customFields, 'responsibid profile'),
      preferredTimeOfContact: getCustomFieldByLabel(customFields, 'Preferred Time of Contact') || getCustomFieldByLabel(customFields, 'Preferred time of contact'),
      pets: getCustomFieldByLabel(customFields, 'Pets'),
      clientsProductsNotes: getCustomFieldByLabel(customFields, 'Clients Products Notes') || getCustomFieldByLabel(customFields, 'clients products notes'),
      trashCanInventory: getCustomFieldByLabel(customFields, 'Trash can Inventory') || getCustomFieldByLabel(customFields, 'trash can inventory'),
      changeSheets: getCustomFieldByLabel(customFields, 'Change Sheets') || getCustomFieldByLabel(customFields, 'change sheets') || getCustomFieldByLabel(customFields, 'chnage sheets'),
      cleaningTech: getCustomFieldByLabel(customFields, 'Cleaning Tech') || getCustomFieldByLabel(customFields, 'cleaning tech'),
      replied: '',

      // JSON Backups
      customFieldsJson: JSON.stringify(customFields),
      clientJson: JSON.stringify(client),
      propertyJson: JSON.stringify(property),
      visitsJson: JSON.stringify(visitsNodes),

      total: total,
    };
  }

  private async generateAndSyncTagsFromJob(jobberJob: any, clientJId: string, clientEmail: string) {
    console.log('🔍 [TAGS DEBUG] generateAndSyncTagsFromJob called');
    console.log('🔍 [TAGS DEBUG] jobberJob.title:', jobberJob.title);
    console.log('🔍 [TAGS DEBUG] jobberJob.jobType:', jobberJob.jobType);
    console.log('🔍 [TAGS DEBUG] clientJId:', clientJId);
    console.log('🔍 [TAGS DEBUG] clientEmail:', clientEmail);
    
    try {
      // Generate new tags from job title
      console.log('🔍 [TAGS DEBUG] Calling generateTagsFromJobTitle...');
      const newTags = this.generateTagsFromJobTitle(jobberJob.title, jobberJob.jobType);
      console.log('🔍 [TAGS DEBUG] Generated new tags:', newTags);
      console.log('🔍 [TAGS DEBUG] New tags count:', newTags.length);

      if (newTags.length === 0) {
        console.log('⚠️ [TAGS DEBUG] No new tags generated, skipping sync');
        return;
      }

      // Fallbacks from custom fields if title doesn't include frequency/zone
      const customFields = jobberJob.customFields || [];
      const frequencyValue =
        this.getCustomFieldByLabel(customFields, 'Frequency') ||
        this.getCustomFieldByLabel(customFields, 'Desired Frequency');
      const zoneValue = this.getCustomFieldByLabel(customFields, 'Zone');

      const hasFrequencyTag = newTags.some((t) =>
        ['Monthly', 'Bi-Weekly', 'Weekly', 'Other'].includes(t),
      );
      if (!hasFrequencyTag && jobberJob.jobType && jobberJob.jobType !== 'ONE_OFF' && jobberJob.jobType !== 'ONE_TIME') {
        const normalized = this.normalizeFrequencyTag(frequencyValue || '');
        if (normalized) {
          newTags.push(normalized);
          console.log(`🔍 [TAGS DEBUG] Added frequency tag from custom field: "${normalized}"`);
        }
      }

      const hasZoneTag = newTags.some((t) => t.toLowerCase().startsWith('zone '));
      if (!hasZoneTag && zoneValue) {
        const zoneMatch = String(zoneValue).match(/(\d+)/);
        if (zoneMatch) {
          newTags.push(`Zone ${zoneMatch[1]}`);
          console.log(`🔍 [TAGS DEBUG] Added zone tag from custom field: "Zone ${zoneMatch[1]}"`);
        }
      }

      const client = jobberJob.client || {};
      const displayName =
        [client.firstName, client.lastName].filter(Boolean).join(' ') || client.displayName || '';
      const mainPhones = client?.phones?.map((p: any) => p?.number).filter(Boolean).join(', ') || '';
      const emails = client?.emails?.map((e: any) => e?.address).filter(Boolean).join(', ') || clientEmail || '';

      await this.tagsService.upsertTagsDb({
        clientJId,
        displayName,
        mainPhones,
        emails,
        createdDate: jobberJob.createdAt || null,
        tags: newTags,
      });

      console.log(`✅ [TAGS DEBUG] Tag sync completed for job: ${jobberJob.id}`);
      this.logger.log(`✅ Tags generated and synced for job: ${jobberJob.id}`);
    } catch (error) {
      console.error('❌ [TAGS DEBUG] Exception in generateAndSyncTagsFromJob:', error);
      console.error('❌ [TAGS DEBUG] Error message:', error.message);
      console.error('❌ [TAGS DEBUG] Error stack:', error.stack);
      this.logger.warn('Failed to generate/sync tags (non-critical):', error.message);
    }
  }

  private generateTagsFromJobTitle(title: string, jobType: string): string[] {
    console.log('🔍 [TAGS DEBUG] generateTagsFromJobTitle called');
    console.log('🔍 [TAGS DEBUG] Input title:', title);
    console.log('🔍 [TAGS DEBUG] Input jobType:', jobType);
    
    const newTags: string[] = [];

    // Always add base tag based on job type (regardless of title format)
    if (jobType === 'ONE_OFF' || jobType === 'ONE_TIME') {
      console.log('🔍 [TAGS DEBUG] Job type is ONE_TIME/ONE_OFF');
      // For ONE_TIME jobs - ALWAYS add "1 Time" tag
      newTags.push('1 Time');
      console.log('🔍 [TAGS DEBUG] Added base tag: "1 Time"');
    } else {
      console.log('🔍 [TAGS DEBUG] Job type is RECURRING');
      // For RECURRING jobs - ALWAYS add "Recurring" tag
      newTags.push('Recurring');
      console.log('🔍 [TAGS DEBUG] Added base tag: "Recurring"');
    }

    if (!title) {
      console.log('⚠️ [TAGS DEBUG] No title provided, returning base tags only');
      return newTags;
    }
    // Try to extract additional info from title if it has the expected format
    const parts = title.split(' | ').map((p) => p.trim());
    console.log('🔍 [TAGS DEBUG] Title parts after split:', parts);
    console.log('🔍 [TAGS DEBUG] Parts count:', parts.length);
    
    if (parts.length >= 3) {
      console.log('✅ [TAGS DEBUG] Title has expected format (3+ parts), extracting Zone/Frequency');
      
      // Extract zone number from parts[2] (e.g., "Zone 2" -> "2")
      const zoneMatch = parts[2]?.match(/Zone\s+(\d+)/i);
      const zoneNumber = zoneMatch ? zoneMatch[1] : '';
      console.log('🔍 [TAGS DEBUG] Zone match result:', zoneMatch);
      console.log('🔍 [TAGS DEBUG] Extracted zone number:', zoneNumber);

      if (jobType === 'ONE_OFF' || jobType === 'ONE_TIME') {
        // For ONE_TIME jobs - add Zone if found
        if (zoneNumber) {
          newTags.push(`Zone ${zoneNumber}`);
          console.log(`🔍 [TAGS DEBUG] Added tag: "Zone ${zoneNumber}"`);
        } else {
          console.log('⚠️ [TAGS DEBUG] No zone number found in parts[2], skipping Zone tag');
        }
      } else {
        // For RECURRING jobs - extract frequency and zone
        // Extract frequency from parts[1] (e.g., "1T" -> 1, "2T" -> 2, "4T" -> 4)
        const freqMatch = parts[1]?.match(/(\d+)/);
        console.log('🔍 [TAGS DEBUG] Frequency match result:', freqMatch);
        if (freqMatch) {
          const x = parseInt(freqMatch[1]);
          console.log('🔍 [TAGS DEBUG] Extracted frequency number:', x);
          const freq =
            x === 1 ? 'Monthly' : x === 2 ? 'Bi-Weekly' : x === 4 ? 'Weekly' : 'Other';
          newTags.push(freq);
          console.log(`🔍 [TAGS DEBUG] Added tag: "${freq}"`);
        } else {
          console.log('⚠️ [TAGS DEBUG] No frequency match found in parts[1]:', parts[1]);
          const lowerTitle = title.toLowerCase();
          if (lowerTitle.includes('bi-weekly') || lowerTitle.includes('biweekly')) {
            newTags.push('Bi-Weekly');
            console.log('🔍 [TAGS DEBUG] Added fallback tag: "Bi-Weekly"');
          } else if (lowerTitle.includes('weekly')) {
            newTags.push('Weekly');
            console.log('🔍 [TAGS DEBUG] Added fallback tag: "Weekly"');
          } else if (lowerTitle.includes('monthly')) {
            newTags.push('Monthly');
            console.log('🔍 [TAGS DEBUG] Added fallback tag: "Monthly"');
          }
        }

        if (zoneNumber) {
          newTags.push(`Zone ${zoneNumber}`);
          console.log(`🔍 [TAGS DEBUG] Added tag: "Zone ${zoneNumber}"`);
        } else {
          const zoneMatchAny = title.match(/Zone\s+(\d+)/i);
          if (zoneMatchAny) {
            newTags.push(`Zone ${zoneMatchAny[1]}`);
            console.log(`🔍 [TAGS DEBUG] Added fallback tag: "Zone ${zoneMatchAny[1]}"`);
          } else {
            console.log('⚠️ [TAGS DEBUG] No zone number found, skipping Zone tag');
          }
        }

        // Check for Flex/Floater
        const lowerParts = parts.map((p) => p.toLowerCase());
        console.log('🔍 [TAGS DEBUG] Lowercase parts for Flex check:', lowerParts);
        if (lowerParts.some((p) => p.includes('flex') || p.includes('floater'))) {
          newTags.push('Flex');
          console.log('🔍 [TAGS DEBUG] Added tag: "Flex"');
        } else {
          console.log('⚠️ [TAGS DEBUG] No Flex/Floater found in title');
        }
      }
    } else {
      console.log('⚠️ [TAGS DEBUG] Title format doesn\'t have 3+ parts, only base tag added');
      // Still try to extract zone from entire title if format is different
      if (jobType === 'ONE_OFF' || jobType === 'ONE_TIME') {
        const zoneMatch = title.match(/Zone\s+(\d+)/i);
        if (zoneMatch) {
          newTags.push(`Zone ${zoneMatch[1]}`);
          console.log(`🔍 [TAGS DEBUG] Found Zone in title, added: "Zone ${zoneMatch[1]}"`);
        }
      } else {
        // For RECURRING, try to find Flex/Floater in entire title
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('flex') || lowerTitle.includes('floater')) {
          newTags.push('Flex');
          console.log('🔍 [TAGS DEBUG] Found Flex/Floater in title, added: "Flex"');
        }
      }
    }

    console.log('🔍 [TAGS DEBUG] Final generated tags:', newTags);
    return newTags;
  }

  private getCustomFieldByLabel(fields: any[], label: string): string {
    const normalize = (val: string) => (val || '').trim().toLowerCase();
    const match = (fields || []).find((f) => normalize(f?.label) === normalize(label));
    if (!match) return '';

    if (match.valueText !== undefined) return match.valueText || '';
    if (match.valueNumeric !== undefined) return String(match.valueNumeric ?? '');
    if (match.valueDropdown !== undefined) return match.valueDropdown || '';
    if (match.valueArea) {
      const { length, width } = match.valueArea;
      return [length, width].filter((v) => v !== undefined && v !== null).join('x');
    }
    if (match.valueLink) {
      const { text, url } = match.valueLink;
      return [text, url].filter(Boolean).join(' ');
    }
    return '';
  }

  private normalizeFrequencyTag(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const lower = raw.toLowerCase();

    if (lower.includes('monthly') || lower === '1x' || lower === '1t' || lower === '1') return 'Monthly';
    if (lower.includes('bi-weekly') || lower.includes('biweekly') || lower === '2x' || lower === '2t' || lower === '2') return 'Bi-Weekly';
    if (lower.includes('weekly') || lower === '4x' || lower === '4t' || lower === '4') return 'Weekly';

    const numMatch = lower.match(/(\d+)/);
    if (numMatch) {
      const x = parseInt(numMatch[1], 10);
      return x === 1 ? 'Monthly' : x === 2 ? 'Bi-Weekly' : x === 4 ? 'Weekly' : 'Other';
    }

    return 'Other';
  }

  async findAll(limit: number = 100, skip: number = 0) {
    try {
      const jobs = await this.prisma.job.findMany({
        take: limit,
        skip: skip,
        orderBy: { createdAt: 'desc' },
      });
      return jobs;
    } catch (error) {
      this.logger.error('Error fetching jobs:', error);
      throw error;
    }
  }

  async findOne(jId: string) {
    try {
      const job = await this.prisma.job.findUnique({
        where: { jId },
      });
      return job;
    } catch (error) {
      this.logger.error('Error fetching job:', error);
      throw error;
    }
  }

  async count() {
    try {
      return await this.prisma.job.count();
    } catch (error) {
      this.logger.error('Error counting jobs:', error);
      throw error;
    }
  }
}
