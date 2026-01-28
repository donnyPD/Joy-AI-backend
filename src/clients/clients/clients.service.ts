import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobberClientsService } from '../../jobber/jobber/jobber-clients.service';
import { TagsService } from '../../tags/tags/tags.service';
import { AuthService } from '../../auth/auth.service';
import { JobberOAuthService } from '../../auth/jobber/jobber-oauth.service';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private prisma: PrismaService,
    private jobberService: JobberClientsService,
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
      // No accountId means we can't map to a user; allow fallback usage if configured.
      this.logger.warn('Webhook payload missing accountId; cannot resolve user-specific token.');
      return undefined;
    }

    const user = await this.authService.getUserByAccountIdOrAttach(accountId);
    if (!user?.id) {
      throw new Error(
        `No connected user found for Jobber accountId ${accountId}. Please disconnect/reconnect Jobber.`,
      );
    }

    // Will auto-refresh if expired; throws if user has no token.
    return await this.jobberOAuthService.getValidAccessToken(user.id);
  }

  async handleClientCreate(webhookPayload: any) {
    try {
      const clientId = webhookPayload.data?.webHookEvent?.itemId;
      if (!clientId) {
        throw new Error('Client ID not found in webhook payload');
      }

      this.logger.log(`Processing CLIENT_CREATE for: ${clientId}`);

      // Fetch full client data from Jobber
      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      const jobberData = await this.jobberService.getClientDetails(clientId, accessToken);
      console.log('Jobber client full response:', JSON.stringify(jobberData, null, 2));
      const jobberClient = jobberData.data?.client;

      if (!jobberClient) {
        throw new Error('Client not found in Jobber');
      }

      // Transform to database schema
      const clientData = this.transformJobberData(jobberClient);

      // Upsert to database
      const client = await this.prisma.client.upsert({
        where: { jId: clientData.jId },
        update: clientData,
        create: clientData,
      });

      // Sync tags from client to tags table
      if (jobberClient.tags?.nodes?.length > 0) {
        const tags = jobberClient.tags.nodes.map((tag: any) => ({
          id: tag.id,
          label: tag.label,
        }));
        await this.tagsService.syncTagsToClient(jobberClient.id, tags).catch((error) => {
          this.logger.warn('Failed to sync tags (non-critical):', error.message);
        });
      }

      this.logger.log(`✅ Client saved: ${client.jId}`);
      return client;
    } catch (error) {
      this.logger.error('Error handling client create:', error);
      throw error;
    }
  }

  async handleClientUpdate(webhookPayload: any) {
    try {
      const clientId = webhookPayload.data?.webHookEvent?.itemId;
      if (!clientId) {
        throw new Error('Client ID not found in webhook payload');
      }

      this.logger.log(`Processing CLIENT_UPDATE for: ${clientId}`);

      // Fetch full client data from Jobber
      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      const jobberData = await this.jobberService.getClientDetails(clientId, accessToken);
      console.log('Jobber client full response:', JSON.stringify(jobberData, null, 2));
      const jobberClient = jobberData.data?.client;

      if (!jobberClient) {
        throw new Error('Client not found in Jobber');
      }

      // Transform to database schema
      const clientData = this.transformJobberData(jobberClient);

      // Upsert to database
      const client = await this.prisma.client.upsert({
        where: { jId: clientData.jId },
        update: clientData,
        create: clientData,
      });

      // Sync tags from client to tags table
      if (jobberClient.tags?.nodes?.length > 0) {
        const tags = jobberClient.tags.nodes.map((tag: any) => ({
          id: tag.id,
          label: tag.label,
        }));
        await this.tagsService.syncTagsToClient(jobberClient.id, tags).catch((error) => {
          this.logger.warn('Failed to sync tags (non-critical):', error.message);
        });
      }

      this.logger.log(`✅ Client updated: ${client.jId}`);
      return client;
    } catch (error) {
      this.logger.error('Error handling client update:', error);
      throw error;
    }
  }

  async handleClientDestroy(webhookPayload: any) {
    try {
      const clientId = webhookPayload.data?.webHookEvent?.itemId;
      if (!clientId) {
        throw new Error('Client ID not found in webhook payload');
      }

      this.logger.log(`Processing CLIENT_DESTROY for: ${clientId}`);

      // Mark as archived or delete
      const client = await this.prisma.client.update({
        where: { jId: clientId },
        data: { archived: true },
      });

      this.logger.log(`✅ Client archived: ${client.jId}`);
      return client;
    } catch (error) {
      this.logger.error('Error handling client destroy:', error);
      throw error;
    }
  }

  async findAll() {
    return this.prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(jId: string) {
    return this.prisma.client.findUnique({
      where: { jId },
    });
  }

  async count() {
    return this.prisma.client.count();
  }

  async updateClientById(id: string, data: { whyCancelled?: string | null; lostRecurring?: boolean; isRecurring?: boolean }) {
    if (!id) {
      throw new Error('Client ID is required');
    }

    return this.prisma.client.update({
      where: { id },
      data: {
        ...(data.whyCancelled !== undefined ? { whyCancelled: data.whyCancelled } : {}),
        ...(data.lostRecurring !== undefined ? { lostRecurring: data.lostRecurring } : {}),
        ...(data.isRecurring !== undefined ? { isRecurring: data.isRecurring } : {}),
      },
    });
  }

  private transformJobberData(jobberClient: any) {
    // Extract phones by type
    const extractPhone = (phones: any[], type: string): string => {
      return phones
        ?.filter((p) => p?.description === type)
        .map((p) => p?.number || '')
        .filter(Boolean)
        .join(', ') || '';
    };

    const normalizeLabel = (label: string) => label?.trim().toLowerCase() || '';
    const extractFieldValue = (field: any): string => {
      if (!field) return '';
      if (field.valueText !== undefined) return field.valueText || '';
      if (field.valueNumeric !== undefined) return String(field.valueNumeric ?? '');
      if (field.valueDropdown !== undefined) return field.valueDropdown || '';
      if (field.valueArea) {
        const { length, width } = field.valueArea;
        return [length, width].filter((v) => v !== undefined && v !== null).join('x');
      }
      if (field.valueLink) {
        const { text, url } = field.valueLink;
        return [text, url].filter(Boolean).join(' ');
      }
      return '';
    };

    const getCustomFieldByLabel = (fields: any[], label: string): string => {
      const target = normalizeLabel(label);
      const match = (fields || []).find((f) => normalizeLabel(f?.label) === target);
      return extractFieldValue(match);
    };

    const customFields = jobberClient.customFields || [];
    const propertyCustomFields = jobberClient.clientProperties?.nodes?.[0]?.customFields || [];

    return {
      jId: jobberClient.id,
      createdDate: jobberClient.createdAt ? new Date(jobberClient.createdAt) : null,
      isCompany: jobberClient.isCompany || false,
      displayName: jobberClient.name || '',
      companyName: jobberClient.companyName || '',
      title: jobberClient.title || '',
      firstName: jobberClient.firstName || '',
      lastName: jobberClient.lastName || '',
      email: jobberClient.emails?.map((e: any) => e?.address).filter(Boolean).join(', ') || '',
      emailsJson: jobberClient.emails ? JSON.stringify(jobberClient.emails) : '',
      mainPhone: extractPhone(jobberClient.phones, 'Main'),
      workPhone: extractPhone(jobberClient.phones, 'Work'),
      mobilePhone: extractPhone(jobberClient.phones, 'Mobile'),
      homePhone: extractPhone(jobberClient.phones, 'Home'),
      faxPhone: extractPhone(jobberClient.phones, 'Fax'),
      otherPhone: extractPhone(jobberClient.phones, 'Other'),
      phonesJson: jobberClient.phones ? JSON.stringify(jobberClient.phones) : '',
      tags: jobberClient.tags?.nodes?.map((node: any) => node.label).join(', ') || '',
      notesJson: jobberClient.notes ? JSON.stringify(jobberClient.notes) : '',
      noteAttachmentsJson: jobberClient.noteAttachments ? JSON.stringify(jobberClient.noteAttachments) : '',
      billingStreet1: jobberClient.billingAddress?.street || '',
      billingStreet2: jobberClient.billingAddress?.street2 || '',
      billingCity: jobberClient.billingAddress?.city || '',
      billingState: jobberClient.billingAddress?.province || '',
      billingCountry: jobberClient.billingAddress?.country || '',
      billingZip: jobberClient.billingAddress?.postalCode || '',
      servicePropertyName: jobberClient.clientProperties?.nodes?.[0]?.name || '',
      serviceStreet1: jobberClient.clientProperties?.nodes?.[0]?.address?.street || '',
      serviceStreet2: jobberClient.clientProperties?.nodes?.[0]?.address?.street2 || '',
      serviceCity: jobberClient.clientProperties?.nodes?.[0]?.address?.city || '',
      serviceState: jobberClient.clientProperties?.nodes?.[0]?.address?.province || '',
      serviceCountry: jobberClient.clientProperties?.nodes?.[0]?.address?.country || '',
      serviceZip: jobberClient.clientProperties?.nodes?.[0]?.address?.postalCode || '',
      cftHavePets: getCustomFieldByLabel(customFields, 'Have Pets'),
      cftHaveKids: getCustomFieldByLabel(customFields, 'Have Kids'),
      cftTrashCanInventory: getCustomFieldByLabel(customFields, 'Trash can Inventory'),
      cftAreasToAvoid: getCustomFieldByLabel(customFields, 'Areas to avoid'),
      cfsChangeSheets: getCustomFieldByLabel(customFields, 'Change sheets?'),
      cftPreferredTimeRecurring: getCustomFieldByLabel(customFields, 'Preferred time for Recurring Services'),
      cfsPreferredTimeContact: getCustomFieldByLabel(customFields, 'Preferred Time of Contact'),
      cftTypeOfProperty: getCustomFieldByLabel(customFields, 'Type of Property'),
      cftAdditionalInfo: getCustomFieldByLabel(customFields, 'Additional Information (client/service)'),
      cftResponsibidProfile: getCustomFieldByLabel(customFields, 'ResponsiBid Profile'),
      pftAddressAdditionalInfo: getCustomFieldByLabel(propertyCustomFields, 'Address additional info'),
      pftApartmentNumber: getCustomFieldByLabel(propertyCustomFields, 'Apartment #'),
      pftFootage: getCustomFieldByLabel(propertyCustomFields, 'Footage'),
      pftNotes: getCustomFieldByLabel(propertyCustomFields, 'Notes'),
      receivesAutoVisitReminders: jobberClient.receivesReminders || false,
      receivesAutoJobFollowups: jobberClient.receivesFollowUps || false,
      receivesAutoQuoteFollowups: jobberClient.receivesQuoteFollowUps || false,
      receivesAutoInvoiceFollowups: jobberClient.receivesInvoiceFollowUps || false,
      archived: jobberClient.isArchived || false,
      textMessageEnabledPhone: jobberClient.phones
        ?.filter((p: any) => p?.smsAllowed)
        .map((p: any) => p?.number || '')
        .filter(Boolean)
        .join(', ') || '',
      leadSource: '',
    };
  }
}
