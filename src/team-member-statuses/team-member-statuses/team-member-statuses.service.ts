import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TeamMemberStatus, Prisma } from '@prisma/client';

@Injectable()
export class TeamMemberStatusesService {
  private readonly logger = new Logger(TeamMemberStatusesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<TeamMemberStatus[]> {
    try {
      return this.prisma.teamMemberStatus.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching team member statuses: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<TeamMemberStatus | null> {
    try {
      return this.prisma.teamMemberStatus.findUnique({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Error fetching team member status ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(data: Prisma.TeamMemberStatusCreateInput): Promise<TeamMemberStatus> {
    try {
      const status = await this.prisma.teamMemberStatus.create({
        data,
      });
      this.logger.log(`Created team member status: ${status.id}`);
      return status;
    } catch (error) {
      this.logger.error(`Error creating team member status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.TeamMemberStatusUpdateInput): Promise<TeamMemberStatus> {
    try {
      const status = await this.prisma.teamMemberStatus.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated team member status: ${id}`);
      return status;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member status with ID ${id} not found`);
      }
      this.logger.error(`Error updating team member status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.teamMemberStatus.delete({
        where: { id },
      });
      this.logger.log(`Deleted team member status: ${id}`);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member status with ID ${id} not found`);
      }
      this.logger.error(`Error deleting team member status: ${error.message}`, error.stack);
      throw error;
    }
  }
}
