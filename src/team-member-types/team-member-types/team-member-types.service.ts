import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
      const type = await this.prisma.teamMemberType.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated team member type: ${id}`);
      return type;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member type with ID ${id} not found`);
      }
      this.logger.error(`Error updating team member type: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.teamMemberType.delete({
        where: { id },
      });
      this.logger.log(`Deleted team member type: ${id}`);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member type with ID ${id} not found`);
      }
      this.logger.error(`Error deleting team member type: ${error.message}`, error.stack);
      throw error;
    }
  }
}
