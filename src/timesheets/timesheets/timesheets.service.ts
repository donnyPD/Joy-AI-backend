import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobberTimesheetsService } from '../../jobber/jobber/jobber-timesheets.service';
import { AuthService } from '../../auth/auth.service';
import { JobberOAuthService } from '../../auth/jobber/jobber-oauth.service';

@Injectable()
export class TimesheetsService {
  private readonly logger = new Logger(TimesheetsService.name);

  constructor(
    private prisma: PrismaService,
    private jobberTimesheetsService: JobberTimesheetsService,
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

  async handleTimesheetCreate(webhookPayload: any) {
    try {
      const entryId = webhookPayload.data?.webHookEvent?.itemId;
      if (!entryId) {
        throw new Error('Timesheet entry ID not found in webhook payload');
      }

      this.logger.log(`Processing TIMESHEET_CREATE for: ${entryId}`);

      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      const jobberData = await this.jobberTimesheetsService.getTimesheetEntryDetails(entryId, accessToken);
      const jobberEntry = jobberData.data?.timeSheetEntry;

      if (!jobberEntry) {
        throw new Error('Timesheet entry not found in Jobber');
      }

      const timesheetData = this.transformJobberData(jobberEntry);

      const timesheet = await this.prisma.timesheet.upsert({
        where: { jId: timesheetData.jId },
        update: timesheetData,
        create: timesheetData,
      });

      this.logger.log(`✅ Timesheet saved: ${timesheet.jId}`);
      return timesheet;
    } catch (error) {
      this.logger.error('Error handling timesheet create:', error);
      throw error;
    }
  }

  async handleTimesheetUpdate(webhookPayload: any) {
    try {
      const entryId = webhookPayload.data?.webHookEvent?.itemId;
      if (!entryId) {
        throw new Error('Timesheet entry ID not found in webhook payload');
      }

      this.logger.log(`Processing TIMESHEET_UPDATE for: ${entryId}`);

      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      const jobberData = await this.jobberTimesheetsService.getTimesheetEntryDetails(entryId, accessToken);
      const jobberEntry = jobberData.data?.timeSheetEntry;

      if (!jobberEntry) {
        throw new Error('Timesheet entry not found in Jobber');
      }

      const timesheetData = this.transformJobberData(jobberEntry);

      const timesheet = await this.prisma.timesheet.upsert({
        where: { jId: timesheetData.jId },
        update: timesheetData,
        create: timesheetData,
      });

      this.logger.log(`✅ Timesheet updated: ${timesheet.jId}`);
      return timesheet;
    } catch (error) {
      this.logger.error('Error handling timesheet update:', error);
      throw error;
    }
  }

  async handleTimesheetDestroy(webhookPayload: any) {
    try {
      const entryId = webhookPayload.data?.webHookEvent?.itemId;
      if (!entryId) {
        throw new Error('Timesheet entry ID not found in webhook payload');
      }

      this.logger.log(`Processing TIMESHEET_DESTROY for: ${entryId}`);

      await this.prisma.timesheet.deleteMany({
        where: { jId: entryId },
      });

      this.logger.log(`✅ Timesheet deleted: ${entryId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error handling timesheet destroy:', error);
      throw error;
    }
  }

  async findAll(limit: number = 100, skip: number = 0) {
    try {
      const timesheets = await this.prisma.timesheet.findMany({
        take: limit,
        skip,
        orderBy: { dbCreatedAt: 'desc' },
      });
      return timesheets;
    } catch (error) {
      this.logger.error('Error fetching timesheets:', error);
      throw error;
    }
  }

  async findOne(jId: string) {
    try {
      const timesheet = await this.prisma.timesheet.findUnique({
        where: { jId },
      });
      return timesheet;
    } catch (error) {
      this.logger.error(`Error fetching timesheet with jId ${jId}:`, error);
      throw error;
    }
  }

  private transformJobberData(jobberEntry: any) {
    const job = jobberEntry.job || {};
    const client = jobberEntry.client || {};
    const user = jobberEntry.user || {};
    const userName = [user.name?.first, user.name?.last].filter(Boolean).join(' ').trim();

    const formatDate = (date: string | null | undefined): string | null => {
      if (!date) return null;
      try {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
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
          hour12: false,
        });
      } catch {
        return null;
      }
    };

    const durationSeconds =
      jobberEntry.duration !== undefined && jobberEntry.duration !== null
        ? String(jobberEntry.duration)
        : null;
    const hours =
      jobberEntry.duration !== undefined && jobberEntry.duration !== null
        ? (Number(jobberEntry.duration) / 3600).toFixed(2)
        : null;

    const jobNumberString =
      job.jobNumber !== undefined && job.jobNumber !== null ? String(job.jobNumber) : null;
    const workingOn =
      jobNumberString || client.name
        ? `Job #${jobNumberString || ''}${client.name ? `-${client.name}` : ''}`
        : null;

    return {
      jId: jobberEntry.id,
      createdAt: jobberEntry.createdAt ? new Date(jobberEntry.createdAt) : null,
      updatedAt: jobberEntry.updatedAt ? new Date(jobberEntry.updatedAt) : null,
      startAt: jobberEntry.startAt ? new Date(jobberEntry.startAt) : null,
      endAt: jobberEntry.endAt ? new Date(jobberEntry.endAt) : null,
      durationSeconds,
      hours,
      note: jobberEntry.note || null,
      jobJId: job.id || null,
      jobNumber: jobNumberString,
      jobTitle: job.title || null,
      clientJId: client.id || null,
      clientName: client.name || null,
      userJId: user.id || null,
      userName: userName || null,
      workingOn,
      date: formatDate(jobberEntry.startAt),
      startTime: formatTime(jobberEntry.startAt),
      endTime: formatTime(jobberEntry.endAt),
      timeSheetJson: JSON.stringify(jobberEntry),
      jobJson: JSON.stringify(job),
      clientJson: JSON.stringify(client),
      userJson: JSON.stringify(user),
    };
  }
}
