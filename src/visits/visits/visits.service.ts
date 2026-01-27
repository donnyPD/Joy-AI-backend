import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobberVisitsService } from '../../jobber/jobber/jobber-visits.service';
import { AuthService } from '../../auth/auth.service';
import { JobberOAuthService } from '../../auth/jobber/jobber-oauth.service';

@Injectable()
export class VisitsService {
  private readonly logger = new Logger(VisitsService.name);

  constructor(
    private prisma: PrismaService,
    private jobberVisitsService: JobberVisitsService,
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

  async handleVisitCreate(webhookPayload: any) {
    try {
      const visitId = webhookPayload.data?.webHookEvent?.itemId;
      if (!visitId) {
        throw new Error('Visit ID not found in webhook payload');
      }

      this.logger.log(`Processing VISIT_CREATE for: ${visitId}`);

      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      const jobberData = await this.jobberVisitsService.getVisitDetails(visitId, accessToken);
      const jobberVisit = jobberData.data?.visit;

      if (!jobberVisit) {
        throw new Error('Visit not found in Jobber');
      }

      const visitData = this.transformJobberData(jobberVisit);

      const visit = await (this.prisma as any).visit.upsert({
        where: { jId: visitData.jId },
        update: visitData,
        create: visitData,
      });

      this.logger.log(`✅ Visit saved: ${visit.jId}`);
      return visit;
    } catch (error) {
      this.logger.error('Error handling visit create:', error);
      throw error;
    }
  }

  async handleVisitUpdate(webhookPayload: any) {
    try {
      const visitId = webhookPayload.data?.webHookEvent?.itemId;
      if (!visitId) {
        throw new Error('Visit ID not found in webhook payload');
      }

      this.logger.log(`Processing VISIT_UPDATE for: ${visitId}`);

      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      const jobberData = await this.jobberVisitsService.getVisitDetails(visitId, accessToken);
      const jobberVisit = jobberData.data?.visit;

      if (!jobberVisit) {
        throw new Error('Visit not found in Jobber');
      }

      const visitData = this.transformJobberData(jobberVisit);

      const visit = await (this.prisma as any).visit.upsert({
        where: { jId: visitData.jId },
        update: visitData,
        create: visitData,
      });

      this.logger.log(`✅ Visit updated: ${visit.jId}`);
      return visit;
    } catch (error) {
      this.logger.error('Error handling visit update:', error);
      throw error;
    }
  }

  async handleVisitDestroy(webhookPayload: any) {
    try {
      const visitId = webhookPayload.data?.webHookEvent?.itemId;
      if (!visitId) {
        throw new Error('Visit ID not found in webhook payload');
      }

      this.logger.log(`Processing VISIT_DESTROY for: ${visitId}`);

      await (this.prisma as any).visit.deleteMany({
        where: { jId: visitId },
      });

      this.logger.log(`✅ Visit deleted: ${visitId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error handling visit destroy:', error);
      throw error;
    }
  }

  async handleVisitCompleted(webhookPayload: any) {
    try {
      const visitId = webhookPayload.data?.webHookEvent?.itemId;
      if (!visitId) {
        throw new Error('Visit ID not found in webhook payload');
      }

      this.logger.log(`Processing VISIT_COMPLETED for: ${visitId}`);

      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      const jobberData = await this.jobberVisitsService.getVisitDetails(visitId, accessToken);
      const jobberVisit: any = jobberData.data?.visit;

      if (!jobberVisit) {
        throw new Error('Visit not found in Jobber');
      }

      const visitData: any = this.transformJobberData(jobberVisit);
      // Update visitCompletedDate when visit is completed
      if (jobberVisit.visitStatus === 'COMPLETED') {
        const formatDate = (date: string | null | undefined): string | null => {
          if (!date) return null;
          try {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          } catch (e) {
            return null;
          }
        };
        visitData.visitCompletedDate = formatDate(new Date().toISOString());
      }

      const visit = await (this.prisma as any).visit.upsert({
        where: { jId: visitData.jId },
        update: visitData,
        create: visitData,
      });

      this.logger.log(`✅ Visit completed: ${visit.jId}`);
      return visit;
    } catch (error) {
      this.logger.error('Error handling visit completed:', error);
      throw error;
    }
  }

  async findAll(limit: number = 100, skip: number = 0) {
    try {
      const visits = await (this.prisma as any).visit.findMany({
        take: limit,
        skip: skip,
        orderBy: { dbCreatedAt: 'desc' },
      });
      return visits;
    } catch (error) {
      this.logger.error('Error fetching visits:', error);
      throw error;
    }
  }

  async findOne(jId: string) {
    try {
      const visit = await (this.prisma as any).visit.findUnique({
        where: { jId },
      });
      return visit;
    } catch (error) {
      this.logger.error(`Error fetching visit with jId ${jId}:`, error);
      throw error;
    }
  }

  private transformJobberData(jobberVisit: any) {
    const getCustomFieldByLabel = (fields: any[], label: string): string | null => {
      if (!fields || !Array.isArray(fields)) return null;
      const field = fields.find(
        (f: any) => f?.label?.toLowerCase() === label.toLowerCase(),
      );
      if (!field) return null;
      return field?.valueText || field?.valueDropdown || field?.valueNumeric || field?.valueArea || field?.valueLink?.text || null;
    };

    const formatDate = (date: string | null | undefined): string | null => {
      if (!date) return null;
      try {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        return null;
      }
    };

    const formatDuration = (start: string | null | undefined, end: string | null | undefined): string | null => {
      if (!start || !end) return null;
      try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate.getTime() - startDate.getTime();
        if (diffMs <= 0) return null;
        const totalMinutes = Math.round(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours && minutes) return `${hours}h ${minutes}m`;
        if (hours) return `${hours}h`;
        return `${minutes}m`;
      } catch {
        return null;
      }
    };

    const formatTime = (date: string | null | undefined): string | null => {
      if (!date) return null;
      try {
        return new Date(date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (e) {
        return null;
      }
    };

    const job = jobberVisit.job || {};
    const client = job.client || {};
    const property = job.property || {};
    const propertyAddress = property.address || {};
    const customFields = job.customFields || [];
    const assignedUsers = jobberVisit.assignedUsers?.nodes || [];
    const lineItems = jobberVisit.lineItems?.nodes || [];

    const clientName = [client.firstName, client.lastName].filter(Boolean).join(' ') || '';
    const clientEmail = client.emails?.[0]?.address || '';
    const clientPhone = client.phones?.[0]?.number || '';

    const assignedTo = assignedUsers.length > 0
      ? `${assignedUsers[0].name?.first || ''} ${assignedUsers[0].name?.last || ''}`.trim()
      : '';

    const startTime = formatTime(jobberVisit.startAt);
    const endTime = formatTime(jobberVisit.endAt);
    const times = startTime && endTime ? `${startTime} - ${endTime}` : null;
    const scheduleDuration = formatDuration(jobberVisit.startAt, jobberVisit.endAt);

    const nonZeroLineItems = lineItems.filter(
      (item: any) => (item?.unitPrice ?? 0) !== 0 || (item?.totalPrice ?? 0) !== 0,
    );
    const lineItemsFormatted = nonZeroLineItems
      .map((item: any) => `${item?.name || 'Unnamed'} – qty: ${item?.qty ?? 0} – unit_Cost: ${item?.unitPrice ?? 0} – total_Cost: ${item?.totalPrice ?? 0}`)
      .join(', ');

    const oneOffJob = job.jobType === 'ONE_OFF' ? (job.total ? String(job.total) : '') : '';

    return {
      jId: jobberVisit.id,
      visitTitle: jobberVisit.title || null,
      visitStatus: jobberVisit.visitStatus || null,
      instructions: jobberVisit.instructions || null,
      date: formatDate(jobberVisit.startAt || jobberVisit.createdAt),
      times: times,
      startAt: jobberVisit.startAt ? new Date(jobberVisit.startAt) : null,
      endAt: jobberVisit.endAt ? new Date(jobberVisit.endAt) : null,
      createdAt: jobberVisit.createdAt ? new Date(jobberVisit.createdAt) : null,
      visitCompletedDate: null, // Will be set when visit is completed
      jobJId: job.id || null,
      jobNumber: job.jobNumber !== undefined && job.jobNumber !== null ? String(job.jobNumber) : null,
      jobType: job.jobType || null,
      jobStatus: job.jobStatus || null,
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
      assignedTo: assignedTo || null,
      lineItemsJson: JSON.stringify(lineItems),
      lineItems: lineItemsFormatted || null,
      oneOffJob: oneOffJob || null,
      visitBased: null,
      scheduleDuration: scheduleDuration || null,
      timeTracked: null,
      typeOfProperty: getCustomFieldByLabel(customFields, 'type of property') || null,
      frequency: getCustomFieldByLabel(customFields, 'frequency') || null,
      referredBy: getCustomFieldByLabel(customFields, 'referred by') || null,
      birthdayMonth: getCustomFieldByLabel(customFields, 'birthday month') || null,
      typeOfCleaning: getCustomFieldByLabel(customFields, 'type of cleaning') || null,
      hours: getCustomFieldByLabel(customFields, 'hours') || null,
      cleaningInstructions: getCustomFieldByLabel(customFields, 'cleaning instructions') || null,
      howToGetInTheHouse: getCustomFieldByLabel(customFields, 'how to get in the house') || null,
      detailToGetInTheHouse:
        getCustomFieldByLabel(customFields, 'detail to get in the house:') ||
        getCustomFieldByLabel(customFields, 'detail to get in the house') ||
        null,
      cleanInsideOfTheStove: getCustomFieldByLabel(customFields, 'clean inside of the stove') || null,
      cleanInsideOfTheFridge: getCustomFieldByLabel(customFields, 'clean inside of the fridge') || null,
      windowsToBeCleaned: getCustomFieldByLabel(customFields, 'windows to be cleaned') || null,
      glassDoorsToBeCleaned: getCustomFieldByLabel(customFields, 'glass doors to be cleaned') || null,
      typerOfProductsToUse:
        getCustomFieldByLabel(customFields, 'typer of products to use:') ||
        getCustomFieldByLabel(customFields, 'typer of products to use') ||
        null,
      squareFoot: getCustomFieldByLabel(customFields, 'square foot') || null,
      exactSqFt: getCustomFieldByLabel(customFields, 'exact sqft') || null,
      zone: getCustomFieldByLabel(customFields, 'zone') || null,
      parkingDetails: getCustomFieldByLabel(customFields, 'parking details') || null,
      responsibidProfile: getCustomFieldByLabel(customFields, 'responsibid profile') || null,
      preferredTimeOfContact:
        getCustomFieldByLabel(customFields, 'preferred time of contact') ||
        getCustomFieldByLabel(customFields, 'preferred time to contact') ||
        null,
      additionalInstructions: getCustomFieldByLabel(customFields, 'additional instructions') || null,
      pets: getCustomFieldByLabel(customFields, 'pets') || null,
      clientsProductsNotes: getCustomFieldByLabel(customFields, 'clients products notes') || null,
      trashCanInventory: getCustomFieldByLabel(customFields, 'trash can inventory') || null,
      changeSheets:
        getCustomFieldByLabel(customFields, 'change sheets?') ||
        getCustomFieldByLabel(customFields, 'change sheets') ||
        getCustomFieldByLabel(customFields, 'chnage sheets') ||
        null,
      cleaningTech: getCustomFieldByLabel(customFields, 'cleaning tech') || null,
      customFieldsJson: JSON.stringify(customFields),
      clientJson: JSON.stringify(client),
      propertyJson: JSON.stringify(property),
      jobJson: JSON.stringify(job),
      assignedUsersJson: JSON.stringify(assignedUsers),
      lineItemsFullJson: JSON.stringify(lineItems),
    };
  }
}
