import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KpiEntry, Prisma } from '@prisma/client';

@Injectable()
export class KpiEntriesService {
  private readonly logger = new Logger(KpiEntriesService.name);

  constructor(private prisma: PrismaService) {}

  async findAllByTeamMember(teamMemberId: string): Promise<KpiEntry[]> {
    try {
      return this.prisma.kpiEntry.findMany({
        where: { teamMemberId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching KPI entries: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(data: Prisma.KpiEntryCreateInput): Promise<KpiEntry> {
    try {
      const entry = await this.prisma.kpiEntry.create({
        data,
      });
      this.logger.log(`Created KPI entry: ${entry.id}`);
      return entry;
    } catch (error) {
      this.logger.error(`Error creating KPI entry: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.KpiEntryUpdateInput): Promise<KpiEntry> {
    try {
      const entry = await this.prisma.kpiEntry.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated KPI entry: ${id}`);
      return entry;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`KPI entry with ID ${id} not found`);
      }
      this.logger.error(`Error updating KPI entry: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.kpiEntry.delete({
        where: { id },
      });
      this.logger.log(`Deleted KPI entry: ${id}`);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`KPI entry with ID ${id} not found`);
      }
      this.logger.error(`Error deleting KPI entry: ${error.message}`, error.stack);
      throw error;
    }
  }
}
