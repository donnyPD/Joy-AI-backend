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

      // Sync tags from client to tags table
      const client = jobberQuote.client;
      if (client?.id && client?.tags?.nodes?.length > 0) {
        const tags = client.tags.nodes.map((tag: any) => ({
          id: tag.id,
          label: tag.label,
        }));
        await this.tagsService.syncTagsToClient(client.id, tags).catch((error) => {
          this.logger.warn('Failed to sync tags (non-critical):', error.message);
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

      // Sync tags from client to tags table
      const client = jobberQuote.client;
      if (client?.id && client?.tags?.nodes?.length > 0) {
        const tags = client.tags.nodes.map((tag: any) => ({
          id: tag.id,
          label: tag.label,
        }));
        await this.tagsService.syncTagsToClient(client.id, tags).catch((error) => {
          this.logger.warn('Failed to sync tags (non-critical):', error.message);
        });
      }

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
      serviceStreet: client.billingAddress?.street || null,
      serviceCity: client.billingAddress?.city || null,
      serviceProvince: client.billingAddress?.province || null,
      serviceZip: client.billingAddress?.postalCode || null,
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
      additionalRequest: getCustomFieldByLabel(customFields, 'Additional Requests') || null,
      zone: getCustomFieldByLabel(customFields, 'Zone') || null,
      dirtScale: getCustomFieldByLabel(customFields, 'Dirt Scale') || null,
      birthdayMonth: getCustomFieldByLabel(customFields, 'Birthday Month') || null,
      referredBy: getCustomFieldByLabel(customFields, 'Referred By') || null,
      typeOfProperty: getCustomFieldByLabel(customFields, 'Type od Property') || null,
      parkingDetails: getCustomFieldByLabel(customFields, 'Parking Details') || null,
      squareFoot: getCustomFieldByLabel(customFields, 'Square Foot') || null,
      frequency: getCustomFieldByLabel(customFields, 'Frequency') || null,
      preferredTimeOfContact: getCustomFieldByLabel(customFields, 'Preferred Time of Contact') || null,
      customFieldsJson: JSON.stringify(customFields),
      clientJson: JSON.stringify(client),
      propertyJson: JSON.stringify(property),
      amountsJson: JSON.stringify(jobberQuote.amounts || {}),
      leadSource: null,
      sentTo: null,
      sentByUser: null,
    };
  }
}
