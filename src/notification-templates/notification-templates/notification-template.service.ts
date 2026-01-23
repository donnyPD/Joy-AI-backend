import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationTemplate, Prisma } from '@prisma/client';

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);

  constructor(private prisma: PrismaService) {}

  async getTemplate(userId: string): Promise<NotificationTemplate | null> {
    try {
      const template = await this.prisma.notificationTemplate.findUnique({
        where: { createdById: userId },
      });
      return template;
    } catch (error) {
      this.logger.error(`Error fetching notification template for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async upsertTemplate(userId: string, template: string): Promise<NotificationTemplate> {
    try {
      const notificationTemplate = await this.prisma.notificationTemplate.upsert({
        where: { createdById: userId },
        update: { template },
        create: { createdById: userId, template },
      });
      this.logger.log(`Notification template updated for user ${userId}`);
      return notificationTemplate;
    } catch (error) {
      this.logger.error(`Error upserting notification template for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
