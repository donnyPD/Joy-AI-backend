import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async checkUsage(name: string): Promise<number> {
    try {
      return await this.prisma.teamMember.count({
        where: { status: name },
      });
    } catch (error) {
      this.logger.error(`Error checking usage for status ${name}: ${error.message}`, error.stack);
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
      const existing = await this.findOne(id);
      if (!existing) {
        throw new NotFoundException(`Team member status with ID ${id} not found`);
      }

      const oldName = existing.name;
      const newName = typeof data.name === 'string' ? data.name : undefined;
      const isDeactivating = data.isActive === false && existing.isActive === true;

      // Check if deactivating and in use
      if (isDeactivating) {
        const count = await this.checkUsage(oldName);
        if (count > 0) {
          throw new BadRequestException(
            `Cannot deactivate this status because it is currently used by ${count} team member(s)`,
          );
        }
      }

      // Update the status
      const status = await this.prisma.teamMemberStatus.update({
        where: { id },
        data,
      });

      // If name changed, update all team members
      if (newName && newName !== oldName) {
        await this.prisma.teamMember.updateMany({
          where: { status: oldName },
          data: { status: newName },
        });
        this.logger.log(`Updated ${await this.checkUsage(newName)} team member(s) to use new status name: ${newName}`);
      }

      this.logger.log(`Updated team member status: ${id}`);
      return status;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member status with ID ${id} not found`);
      }
      this.logger.error(`Error updating team member status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const existing = await this.findOne(id);
      if (!existing) {
        throw new NotFoundException(`Team member status with ID ${id} not found`);
      }

      // Check if any team members use this status
      const count = await this.checkUsage(existing.name);
      if (count > 0) {
        throw new BadRequestException(
          `Cannot delete this status because it is currently used by ${count} team member(s)`,
        );
      }

      await this.prisma.teamMemberStatus.delete({
        where: { id },
      });
      this.logger.log(`Deleted team member status: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member status with ID ${id} not found`);
      }
      this.logger.error(`Error deleting team member status: ${error.message}`, error.stack);
      throw error;
    }
  }
}
