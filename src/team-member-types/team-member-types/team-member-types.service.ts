import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TeamMemberType, Prisma } from '@prisma/client';

@Injectable()
export class TeamMemberTypesService {
  private readonly logger = new Logger(TeamMemberTypesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<TeamMemberType[]> {
    try {
      return this.prisma.teamMemberType.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching team member types: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<TeamMemberType | null> {
    try {
      return this.prisma.teamMemberType.findUnique({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Error fetching team member type ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async checkUsage(name: string): Promise<number> {
    try {
      return await this.prisma.teamMember.count({
        where: { type: name },
      });
    } catch (error) {
      this.logger.error(`Error checking usage for type ${name}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(data: Prisma.TeamMemberTypeCreateInput): Promise<TeamMemberType> {
    try {
      const type = await this.prisma.teamMemberType.create({
        data,
      });
      this.logger.log(`Created team member type: ${type.id}`);
      return type;
    } catch (error) {
      this.logger.error(`Error creating team member type: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.TeamMemberTypeUpdateInput): Promise<TeamMemberType> {
    try {
      const existing = await this.findOne(id);
      if (!existing) {
        throw new NotFoundException(`Team member type with ID ${id} not found`);
      }

      const oldName = existing.name;
      const newName = typeof data.name === 'string' ? data.name : undefined;
      const isDeactivating = data.isActive === false && existing.isActive === true;

      // Check if deactivating and in use
      if (isDeactivating) {
        const count = await this.checkUsage(oldName);
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

      // If name changed, update all team members
      if (newName && newName !== oldName) {
        await this.prisma.teamMember.updateMany({
          where: { type: oldName },
          data: { type: newName },
        });
        this.logger.log(`Updated ${await this.checkUsage(newName)} team member(s) to use new type name: ${newName}`);
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

  async delete(id: string): Promise<void> {
    try {
      const existing = await this.findOne(id);
      if (!existing) {
        throw new NotFoundException(`Team member type with ID ${id} not found`);
      }

      // Check if any team members use this type
      const count = await this.checkUsage(existing.name);
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
