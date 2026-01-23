import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KpiEntry, Prisma } from '@prisma/client';

@Injectable()
export class KpiEntriesService {
  private readonly logger = new Logger(KpiEntriesService.name);

  constructor(private prisma: PrismaService) {}

  async findAllByTeamMember(teamMemberId: string, createdById: string): Promise<KpiEntry[]> {
    try {
      // First verify the team member belongs to the user
      const teamMember = await this.prisma.teamMember.findFirst({
        where: {
          id: teamMemberId,
          createdById,
        },
      });

      if (!teamMember) {
        // Team member doesn't exist or doesn't belong to this user
        this.logger.warn(`Team member ${teamMemberId} not found or doesn't belong to user ${createdById}`);
        return [];
      }

      // Now fetch KPI entries for this team member that belong to this user
      const entries = await this.prisma.kpiEntry.findMany({
        where: { 
          teamMemberId,
          createdById,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      this.logger.log(`Found ${entries.length} KPI entries for team member ${teamMemberId} created by user ${createdById}`);
      return entries;
    } catch (error) {
      this.logger.error(`Error fetching KPI entries: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(createdById: string): Promise<KpiEntry[]> {
    try {
      return this.prisma.kpiEntry.findMany({
        where: { createdById },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching all KPI entries: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(data: Prisma.KpiEntryCreateInput, createdById: string): Promise<KpiEntry> {
    try {
      // Exclude createdBy relation and use createdById directly
      const { createdBy, ...dataWithoutRelation } = data as any;
      const entry = await this.prisma.kpiEntry.create({
        data: {
          ...dataWithoutRelation,
          createdById,
        } as Prisma.KpiEntryUncheckedCreateInput,
      });
      this.logger.log(`Created KPI entry: ${entry.id} by user: ${createdById}`);
      return entry;
    } catch (error) {
      this.logger.error(`Error creating KPI entry: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, createdById: string): Promise<KpiEntry | null> {
    return this.prisma.kpiEntry.findFirst({
      where: { 
        id,
        createdById,
      },
    });
  }

  async update(id: string, data: Prisma.KpiEntryUpdateInput, createdById: string): Promise<KpiEntry> {
    try {
      // First verify the record belongs to the user
      const existing = await this.findOne(id, createdById);
      if (!existing) {
        throw new NotFoundException(`KPI entry with ID ${id} not found`);
      }

      const entry = await this.prisma.kpiEntry.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated KPI entry: ${id}`);
      return entry;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`KPI entry with ID ${id} not found`);
      }
      this.logger.error(`Error updating KPI entry: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string, createdById: string): Promise<void> {
    try {
      // First verify the record belongs to the user
      const existing = await this.findOne(id, createdById);
      if (!existing) {
        throw new NotFoundException(`KPI entry with ID ${id} not found`);
      }

      await this.prisma.kpiEntry.delete({
        where: { id },
      });
      this.logger.log(`Deleted KPI entry: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`KPI entry with ID ${id} not found`);
      }
      this.logger.error(`Error deleting KPI entry: ${error.message}`, error.stack);
      throw error;
    }
  }
}
