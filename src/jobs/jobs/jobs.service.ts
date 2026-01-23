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
      if (client?.id && jobberJob.title) {
        this.logger.log('🏷️ Generating tags from job title...');
        await this.generateAndSyncTagsFromJob(jobberJob, client.id, client.emails?.[0]?.address || '');
        this.logger.log('✅ Tags generated');
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
      if (client?.id && jobberJob.title) {
        await this.generateAndSyncTagsFromJob(jobberJob, client.id, client.emails?.[0]?.address || '');
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
    try {
      if (!jobberJob.title) {
        return;
      }

      // Get existing tags from Tags table
      const existingTags = await this.tagsService.getTagsByClient(clientJId);
      const existingTagLabels = existingTags.map((t) => t.label);

      // Generate new tags from job title
      const newTags = this.generateTagsFromJobTitle(jobberJob.title, jobberJob.jobType);

      // Merge without duplicates
      const allTagLabels = [...new Set([...existingTagLabels, ...newTags])];

      // Sync to Tags table
      const tagsToSync = allTagLabels.map((label) => ({
        id: '', // Will be generated or fetched from Jobber if needed
        label: label,
      }));

      // Sync new tags to Tags table
      for (const tagLabel of newTags) {
        if (!existingTagLabels.includes(tagLabel)) {
          // Check if tag with same label exists for this client
          const existingTag = await this.prisma.tag.findFirst({
            where: { label: tagLabel, clientJId: clientJId },
          });

          if (!existingTag) {
            // Create new tag entry with unique temp ID
            const tempJId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            try {
              await this.prisma.tag.create({
                data: {
                  jId: tempJId,
                  label: tagLabel,
                  clientJId: clientJId,
                },
              });
              this.logger.log(`✅ Created tag: ${tagLabel} for client: ${clientJId}`);
            } catch (error: any) {
              // If creation fails (e.g., duplicate jId), try to find and update
              if (error.code === 'P2002') {
                // Unique constraint violation - tag might exist with different jId
                const foundTag = await this.prisma.tag.findFirst({
                  where: { label: tagLabel, clientJId: clientJId },
                });
                if (!foundTag) {
                  this.logger.warn(`Failed to create tag ${tagLabel}:`, error.message);
                }
              } else {
                this.logger.warn(`Failed to create tag ${tagLabel}:`, error.message);
              }
            }
          }
        }
      }

      this.logger.log(`✅ Tags generated and synced for job: ${jobberJob.id}`);
    } catch (error) {
      this.logger.warn('Failed to generate/sync tags (non-critical):', error.message);
    }
  }

  private generateTagsFromJobTitle(title: string, jobType: string): string[] {
    if (!title) return [];

    const parts = title.split(' | ').map((p) => p.trim());
    if (parts.length < 3) return [];

    const newTags: string[] = [];

    // Extract zone number from parts[2] (e.g., "Zone 2" -> "2")
    const zoneMatch = parts[2]?.match(/Zone\s+(\d+)/i);
    const zoneNumber = zoneMatch ? zoneMatch[1] : '';

    if (jobType === 'ONE_OFF' || jobType === 'ONE_TIME') {
      // For ONE_TIME jobs
      newTags.push('1 Time');
      if (zoneNumber) {
        newTags.push(`Zone ${zoneNumber}`);
      }
    } else {
      // For RECURRING jobs
      newTags.push('Recurring');

      // Extract frequency from parts[1] (e.g., "1T" -> 1, "2T" -> 2, "4T" -> 4)
      const freqMatch = parts[1]?.match(/(\d+)/);
      if (freqMatch) {
        const x = parseInt(freqMatch[1]);
        const freq =
          x === 1 ? 'Monthly' : x === 2 ? 'Bi-Weekly' : x === 4 ? 'Weekly' : 'Other';
        newTags.push(freq);
      }

      if (zoneNumber) {
        newTags.push(`Zone ${zoneNumber}`);
      }

      // Check for Flex/Floater
      const lowerParts = parts.map((p) => p.toLowerCase());
      if (lowerParts.some((p) => p.includes('flex') || p.includes('floater'))) {
        newTags.push('Flex');
      }
    }

    return newTags;
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
