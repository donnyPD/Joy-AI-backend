import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  async getSetting(key: string): Promise<{ key: string; value: string } | null> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key },
      });
      return setting;
    } catch (error) {
      this.logger.error(`Error fetching setting ${key}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async upsertSetting(key: string, value: string): Promise<{ key: string; value: string }> {
    try {
      const setting = await this.prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      this.logger.log(`Setting ${key} updated`);
      return setting;
    } catch (error) {
      this.logger.error(`Error upserting setting ${key}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
