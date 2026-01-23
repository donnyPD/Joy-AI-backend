import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TeamMemberType, Prisma } from '@prisma/client';

@Injectable()
export class TeamMemberTypesService {
  private readonly logger = new Logger(TeamMemberTypesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(createdById: string): Promise<TeamMemberType[]> {
    try {
      return this.prisma.teamMemberType.findMany({
        where: { createdById },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching team member types: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, createdById: string): Promise<TeamMemberType | null> {
    try {
      return this.prisma.teamMemberType.findFirst({
        where: { 
          id,
          createdById,
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching team member type ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async checkUsage(name: string, createdById: string): Promise<number> {
    try {
      return await this.prisma.teamMember.count({
        where: { 
          type: name,
          createdById,
        },
      });
    } catch (error) {
      this.logger.error(`Error checking usage for type ${name}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(data: Prisma.TeamMemberTypeCreateInput, createdById: string): Promise<TeamMemberType> {
    try {
      // Exclude createdBy relation and use createdById directly
      const { createdBy, ...dataWithoutRelation } = data as any;
      const type = await this.prisma.teamMemberType.create({
        data: {
          ...dataWithoutRelation,
          createdById,
        } as Prisma.TeamMemberTypeUncheckedCreateInput,
      });
      this.logger.log(`Created team member type: ${type.id} by user: ${createdById}`);
      return type;
    } catch (error) {
      this.logger.error(`Error creating team member type: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.TeamMemberTypeUpdateInput, createdById: string): Promise<TeamMemberType> {
    try {
      const existing = await this.findOne(id, createdById);
      if (!existing) {
        throw new NotFoundException(`Team member type with ID ${id} not found`);
      }

      const oldName = existing.name;
      const newName = typeof data.name === 'string' ? data.name : undefined;
      const isDeactivating = data.isActive === false && existing.isActive === true;

      // Check if deactivating and in use (only check user's own team members)
      if (isDeactivating) {
        const count = await this.checkUsage(oldName, createdById);
        if (count > 0) {
          throw new BadRequestException(
            `Cannot deactivate this type because it is currently used by ${count} team member(s)`,
          );
        }
      }

      // Update the type
      const type = await this.prisma.teamMemberType.update({
        where: { id },
        data,
      });

      // If name changed, update all team members (only user's own team members)
      if (newName && newName !== oldName) {
        await this.prisma.teamMember.updateMany({
          where: { 
            type: oldName,
            createdById,
          },
          data: { type: newName },
        });
        this.logger.log(`Updated ${await this.checkUsage(newName, createdById)} team member(s) to use new type name: ${newName}`);
      }

      this.logger.log(`Updated team member type: ${id}`);
      return type;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member type with ID ${id} not found`);
      }
      this.logger.error(`Error updating team member type: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string, createdById: string): Promise<void> {
    try {
      const existing = await this.findOne(id, createdById);
      if (!existing) {
        throw new NotFoundException(`Team member type with ID ${id} not found`);
      }

      // Check if any team members use this type (only check user's own team members)
      const count = await this.checkUsage(existing.name, createdById);
      if (count > 0) {
        throw new BadRequestException(
          `Cannot delete this type because it is currently used by ${count} team member(s)`,
        );
      }

      await this.prisma.teamMemberType.delete({
        where: { id },
      });
      this.logger.log(`Deleted team member type: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member type with ID ${id} not found`);
      }
      this.logger.error(`Error deleting team member type: ${error.message}`, error.stack);
      throw error;
    }
  }
}
