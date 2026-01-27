import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobberQuotesService } from '../../jobber/jobber/jobber-quotes.service';
import { TagsService } from '../../tags/tags/tags.service';
import { AuthService } from '../../auth/auth.service';
import { JobberOAuthService } from '../../auth/jobber/jobber-oauth.service';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private prisma: PrismaService,
    private jobberQuotesService: JobberQuotesService,
    private tagsService: TagsService,
    private authService: AuthService,
    private jobberOAuthService: JobberOAuthService,
  ) {}

  private async getAccessTokenForWebhook(webhookPayload: any): Promise<string | undefined> {
    const accountId =
      webhookPayload.data?.webHookEvent?.accountId ||
      webhookPayload.accountId ||
      webhookPayload.data?.accountId;

    if (!accountId) {
      this.logger.warn('Webhook payload missing accountId; cannot resolve user-specific token.');
      return undefined;
    }

    const user = await this.authService.getUserByAccountIdOrAttach(accountId);
    if (!user?.id) {
      throw new Error(
        `No connected user found for Jobber accountId ${accountId}. Please disconnect/reconnect Jobber.`,
      );
    }

    return await this.jobberOAuthService.getValidAccessToken(user.id);
  }

  async handleQuoteCreate(webhookPayload: any) {
    try {
      const quoteId = webhookPayload.data?.webHookEvent?.itemId;
      if (!quoteId) {
        throw new Error('Quote ID not found in webhook payload');
      }

      this.logger.log(`Processing QUOTE_CREATE for: ${quoteId}`);

      // Fetch full quote data from Jobber
      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      const jobberData = await this.jobberQuotesService.getQuoteDetails(quoteId, accessToken);
      console.log('Jobber quote full response:', JSON.stringify(jobberData, null, 2));
      const jobberQuote = jobberData.data?.quote;

      if (!jobberQuote) {
        throw new Error('Quote not found in Jobber');
      }

      // Transform to database schema
      const quoteData = this.transformJobberData(jobberQuote);

      // Upsert to database
      const quote = await this.prisma.quote.upsert({
        where: { jId: quoteData.jId },
        update: quoteData,
        create: quoteData,
      });

      const client = jobberQuote.client;

      // PULL 1: Generate and sync tags from quote data (City, Referred by, New Lead)
      if (client?.id) {
        await this.generateAndSyncTagsFromQuote(
          quoteData,
          client.id,
          client.emails?.[0]?.address || '',
          client,
        ).catch((error) => {
          this.logger.warn('Failed to generate/sync quote tags (non-critical):', error.message);
        });
      }

      this.logger.log(`✅ Quote saved: ${quote.jId}`);
      return quote;
    } catch (error) {
      this.logger.error('Error handling quote create:', error);
      throw error;
    }
  }

  async handleQuoteUpdate(webhookPayload: any) {
    try {
      const quoteId = webhookPayload.data?.webHookEvent?.itemId;
      if (!quoteId) {
        throw new Error('Quote ID not found in webhook payload');
      }

      this.logger.log(`Processing QUOTE_UPDATE for: ${quoteId}`);

      // Fetch full quote data from Jobber
      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      const jobberData = await this.jobberQuotesService.getQuoteDetails(quoteId, accessToken);
      console.log('Jobber quote full response:', JSON.stringify(jobberData, null, 2));
      const jobberQuote = jobberData.data?.quote;

      if (!jobberQuote) {
        throw new Error('Quote not found in Jobber');
      }

      // Transform to database schema
      const quoteData = this.transformJobberData(jobberQuote);

      // Upsert to database
      const quote = await this.prisma.quote.upsert({
        where: { jId: quoteData.jId },
        update: quoteData,
        create: quoteData,
      });

      const client = jobberQuote.client;

      this.logger.log(`✅ Quote updated: ${quote.jId}`);
      return quote;
    } catch (error) {
      this.logger.error('Error handling quote update:', error);
      throw error;
    }
  }

  async handleQuoteSent(webhookPayload: any) {
    return this.handleQuoteUpdate(webhookPayload);
  }

  async handleQuoteApproved(webhookPayload: any) {
    return this.handleQuoteUpdate(webhookPayload);
  }

  async handleQuoteDestroy(webhookPayload: any) {
    try {
      const quoteId = webhookPayload.data?.webHookEvent?.itemId;
      if (!quoteId) {
        throw new Error('Quote ID not found in webhook payload');
      }

      this.logger.log(`Processing QUOTE_DESTROY for: ${quoteId}`);

      // Mark as archived or delete
      const quote = await this.prisma.quote.update({
        where: { jId: quoteId },
        data: { status: 'archived', archivedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
      });

      this.logger.log(`✅ Quote archived: ${quote.jId}`);
      return quote;
    } catch (error) {
      this.logger.error('Error handling quote destroy:', error);
      throw error;
    }
  }

  private transformJobberData(jobberQuote: any) {
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

    const quoteStatus = (jobberQuote.quoteStatus || '').toLowerCase();
    const now = new Date();
    const dateFormat = { month: 'short' as const, day: 'numeric' as const, year: 'numeric' as const };

    // Status-based dates (conditional)
    const draftedDate = quoteStatus === 'draft' ? now.toLocaleDateString('en-US', dateFormat) : '';
    const sentDate = quoteStatus === 'awaiting_response' ? now.toLocaleDateString('en-US', dateFormat) : '';
    const changesRequestedDate = quoteStatus === 'changes_requested' ? now.toLocaleDateString('en-US', dateFormat) : '';
    const approvedDate = quoteStatus === 'approved' ? now.toLocaleDateString('en-US', dateFormat) : '';
    const convertedDate = quoteStatus === 'converted' ? now.toLocaleDateString('en-US', dateFormat) : '';
    const archivedDate = quoteStatus === 'archived' ? now.toLocaleDateString('en-US', dateFormat) : '';

    // Client info
    const client = jobberQuote.client || {};
    const clientName = [client.firstName, client.lastName].filter(Boolean).join(' ') || '';
    const clientEmail = client.emails?.[0]?.address || '';
    const clientPhone = client.phones?.[0]?.number || '';
    const sentTo = client.emails?.map((email: any) => email?.address).filter(Boolean).join(', ') || '';

    // Property info
    const property = jobberQuote.property || {};
    const propertyAddress = property.address || {};

    // Salesperson
    const salespersonName = jobberQuote.salesperson?.name
      ? [jobberQuote.salesperson.name.first, jobberQuote.salesperson.name.last].filter(Boolean).join(' ')
      : '';

    // Line items formatting
    const lineItems = jobberQuote.lineItems?.nodes || [];
    const nonZeroLineItems = lineItems.filter(
      (item: any) => (item?.unitPrice ?? 0) !== 0 || (item?.totalPrice ?? 0) !== 0,
    );
    const lineItemsFormatted = nonZeroLineItems
      .map((item: any) => `${item?.name || 'Unnamed'} – qty: ${item?.qty ?? 0} – unit_cost: ${item?.unitPrice ?? 0} – total_cost: ${item?.totalPrice ?? 0}`)
      .join(', ');

    // Job numbers
    const jobs = jobberQuote.jobs?.nodes || [];
    const jobNumbers = jobs.map((job: any) => job?.jobNumber).filter(Boolean).join(', ') || '';

    // Custom fields (label-based mapping)
    const customFields = jobberQuote.customFields || [];

    // ClientHubViewedAt formatting
    let clientHubViewedAt = '';
    if (jobberQuote.clientHubViewedAt) {
      try {
        const viewedDate = new Date(jobberQuote.clientHubViewedAt);
        const dateStr = viewedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = viewedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        clientHubViewedAt = `${dateStr} ${timeStr}`;
      } catch (e) {
        clientHubViewedAt = String(jobberQuote.clientHubViewedAt);
      }
    }

    return {
      jId: jobberQuote.id,
      quoteNumber: jobberQuote.quoteNumber || null,
      clientJId: client.id || null,
      clientName: clientName || null,
      clientEmail: clientEmail || null,
      clientPhone: clientPhone || null,
      servicePropertyName: property.name || null,
      serviceStreet: propertyAddress.street || null,
      serviceCity: propertyAddress.city || null,
      serviceProvince: propertyAddress.province || null,
      serviceZip: propertyAddress.postalCode || null,
      serviceCountry: propertyAddress.country || null,
      title: jobberQuote.title || null,
      status: jobberQuote.quoteStatus || null,
      salesperson: salespersonName || null,
      subtotal: jobberQuote.amounts?.subtotal != null ? String(jobberQuote.amounts.subtotal) : null,
      total: jobberQuote.amounts?.total != null ? String(jobberQuote.amounts.total) : null,
      discount: jobberQuote.amounts?.discountAmount != null ? String(jobberQuote.amounts.discountAmount) : null,
      collectedDeposit: jobberQuote.amounts?.depositAmount != null ? String(jobberQuote.amounts.depositAmount) : null,
      requiredDeposit: null,
      draftedDate: draftedDate || null,
      sentDate: sentDate || null,
      changesRequestedDate: changesRequestedDate || null,
      approvedDate: approvedDate || null,
      convertedDate: convertedDate || null,
      archivedDate: archivedDate || null,
      sentAt: jobberQuote.sentAt ? new Date(jobberQuote.sentAt) : null,
      clientHubViewedAt: clientHubViewedAt || null,
      createdAt: jobberQuote.createdAt ? new Date(jobberQuote.createdAt) : null,
      updatedAt: jobberQuote.updatedAt ? new Date(jobberQuote.updatedAt) : null,
      lineItemsJson: JSON.stringify(lineItems),
      lineItems: lineItemsFormatted || null,
      jobNumbers: jobNumbers || null,
      timeEstimated: getCustomFieldByLabel(customFields, 'Time Estimated') || null,
      desiredFrequency: getCustomFieldByLabel(customFields, 'Desired Frequency') || null,
      typeOfCleaning: getCustomFieldByLabel(customFields, 'Type of Cleaning') || null,
      exactSqFt: getCustomFieldByLabel(customFields, 'Exact SqFt') || null,
      additionalRequest:
        getCustomFieldByLabel(customFields, 'Additional Request') ||
        getCustomFieldByLabel(customFields, 'Additional Requests') ||
        null,
      zone: getCustomFieldByLabel(customFields, 'Zone') || null,
      dirtScale: getCustomFieldByLabel(customFields, 'Dirt Scale') || null,
      birthdayMonth: getCustomFieldByLabel(customFields, 'Birthday Month') || null,
      referredBy: getCustomFieldByLabel(customFields, 'Referred By') || null,
      typeOfProperty:
        getCustomFieldByLabel(customFields, 'Type of Property') ||
        getCustomFieldByLabel(customFields, 'Type od Property') ||
        null,
      parkingDetails: getCustomFieldByLabel(customFields, 'Parking Details') || null,
      squareFoot: getCustomFieldByLabel(customFields, 'Square Foot') || null,
      frequency: getCustomFieldByLabel(customFields, 'Frequency') || null,
      preferredTimeOfContact: getCustomFieldByLabel(customFields, 'Preferred Time of Contact') || null,
      customFieldsJson: JSON.stringify(customFields),
      clientJson: JSON.stringify(client),
      propertyJson: JSON.stringify(property),
      amountsJson: JSON.stringify(jobberQuote.amounts || {}),
      leadSource:
        getCustomFieldByLabel(customFields, 'Lead Source') ||
        getCustomFieldByLabel(client.customFields || [], 'Lead Source') ||
        null,
      sentTo: sentTo || null,
      sentByUser: salespersonName || null,
    };
  }

  /**
   * PULL 1: Generate and sync tags from quote data
   * Tags to generate:
   * - City (from contact info)
   * - Referred by (from job title)
   * - "New Lead" (hardcoded)
   */
  private async generateAndSyncTagsFromQuote(
    quoteData: any,
    clientJId: string,
    clientEmail: string,
    client: any,
  ) {
    console.log(
      `🔍 [QUOTE TAGS DEBUG] Starting generateAndSyncTagsFromQuote for client: ${clientJId}, email: ${clientEmail}`,
    );
    try {
      const newTags: string[] = [];

      const billingCity = client?.billingAddress?.city || '';
      const serviceCity = quoteData.serviceCity || '';
      const cityTag = billingCity || serviceCity;

      // TAG 1: City (from contact info)
      if (cityTag) {
        newTags.push(cityTag);
        console.log(`🔍 [QUOTE TAGS DEBUG] Added City tag: "${cityTag}"`);
      }

      const referredByFromTitle = this.extractReferredByFromTitle(quoteData.title);
      const referredByTag = referredByFromTitle || '';

      // TAG 2: Referred by (from job title)
      if (referredByTag) {
        newTags.push(referredByTag);
        console.log(`🔍 [QUOTE TAGS DEBUG] Added Referred by tag: "${referredByTag}"`);
      }

      // TAG 3: "New Lead" (hardcoded)
      newTags.push('New Lead');
      console.log(`🔍 [QUOTE TAGS DEBUG] Added "New Lead" tag (hardcoded)`);

      const displayName =
        [client?.firstName, client?.lastName].filter(Boolean).join(' ') ||
        client?.displayName ||
        '';
      const mainPhones = client?.phones?.map((p: any) => p?.number).filter(Boolean).join(', ') || '';
      const emails = client?.emails?.map((e: any) => e?.address).filter(Boolean).join(', ') || clientEmail || '';

      await this.tagsService.upsertTagsDb({
        clientJId,
        displayName,
        mainPhones,
        emails,
        createdDate: quoteData.createdAt,
        tags: newTags,
      });

      console.log(`✅ [QUOTE TAGS DEBUG] Tags generated and synced for quote: ${quoteData.jId}`);
      this.logger.log(`✅ Quote tags generated and synced for quote: ${quoteData.jId}`);
    } catch (error) {
      console.error('[QUOTE TAGS DEBUG] ❌ Failed to generate/sync quote tags (non-critical):', error.message);
      this.logger.warn('Failed to generate/sync quote tags (non-critical):', error.message);
    }
  }

  private extractReferredByFromTitle(title?: string): string {
    if (!title) return '';
    const match = title.match(/referred\s*by\s*[:\-]?\s*([^|]+)/i);
    if (!match) return '';
    return (match[1] || '').trim();
  }

  async findAll(limit: number = 100, skip: number = 0) {
    try {
      const quotes = await this.prisma.quote.findMany({
        take: limit,
        skip: skip,
        orderBy: { createdAt: 'desc' },
      });
      return quotes;
    } catch (error) {
      this.logger.error('Error fetching quotes:', error);
      throw error;
    }
  }

  async findOne(jId: string) {
    try {
      const quote = await this.prisma.quote.findUnique({
        where: { jId },
      });
      return quote;
    } catch (error) {
      this.logger.error('Error fetching quote:', error);
      throw error;
    }
  }

  async count() {
    try {
      return await this.prisma.quote.count();
    } catch (error) {
      this.logger.error('Error counting quotes:', error);
      throw error;
    }
  }
}
