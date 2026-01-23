import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TeamMemberStatus, Prisma } from '@prisma/client';

@Injectable()
export class TeamMemberStatusesService {
  private readonly logger = new Logger(TeamMemberStatusesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(createdById: string): Promise<TeamMemberStatus[]> {
    try {
      return this.prisma.teamMemberStatus.findMany({
        where: { createdById },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching team member statuses: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, createdById: string): Promise<TeamMemberStatus | null> {
    try {
      return this.prisma.teamMemberStatus.findFirst({
        where: { 
          id,
          createdById,
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching team member status ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async checkUsage(name: string, createdById: string): Promise<number> {
    try {
      return await this.prisma.teamMember.count({
        where: { 
          status: name,
          createdById,
        },
      });
    } catch (error) {
      this.logger.error(`Error checking usage for status ${name}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(data: Prisma.TeamMemberStatusCreateInput, createdById: string): Promise<TeamMemberStatus> {
    try {
      // Exclude createdBy relation and use createdById directly
      const { createdBy, ...dataWithoutRelation } = data as any;
      const status = await this.prisma.teamMemberStatus.create({
        data: {
          ...dataWithoutRelation,
          createdById,
        } as Prisma.TeamMemberStatusUncheckedCreateInput,
      });
      this.logger.log(`Created team member status: ${status.id} by user: ${createdById}`);
      return status;
    } catch (error) {
      this.logger.error(`Error creating team member status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.TeamMemberStatusUpdateInput, createdById: string): Promise<TeamMemberStatus> {
    try {
      const existing = await this.findOne(id, createdById);
      if (!existing) {
        throw new NotFoundException(`Team member status with ID ${id} not found`);
      }

      const oldName = existing.name;
      const newName = typeof data.name === 'string' ? data.name : undefined;
      const isDeactivating = data.isActive === false && existing.isActive === true;

      // Check if deactivating and in use (only check user's own team members)
      if (isDeactivating) {
        const count = await this.checkUsage(oldName, createdById);
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

      // If name changed, update all team members (only user's own team members)
      if (newName && newName !== oldName) {
        await this.prisma.teamMember.updateMany({
          where: { 
            status: oldName,
            createdById,
          },
          data: { status: newName },
        });
        this.logger.log(`Updated ${await this.checkUsage(newName, createdById)} team member(s) to use new status name: ${newName}`);
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

  async delete(id: string, createdById: string): Promise<void> {
    try {
      const existing = await this.findOne(id, createdById);
      if (!existing) {
        throw new NotFoundException(`Team member status with ID ${id} not found`);
      }

      // Check if any team members use this status (only check user's own team members)
      const count = await this.checkUsage(existing.name, createdById);
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
