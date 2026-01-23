import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TeamMember, Prisma } from '@prisma/client';

@Injectable()
export class TeamMembersService {
  private readonly logger = new Logger(TeamMembersService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(createdById: string): Promise<TeamMember[]> {
    return this.prisma.teamMember.findMany({
      where: { createdById },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, createdById: string): Promise<TeamMember | null> {
    return this.prisma.teamMember.findFirst({
      where: { 
        id,
        createdById,
      },
    });
  }

  async count(createdById: string): Promise<number> {
    return this.prisma.teamMember.count({
      where: { createdById },
    });
  }

  async create(data: Prisma.TeamMemberCreateInput, createdById: string): Promise<TeamMember> {
    try {
      // Exclude createdBy relation and use createdById directly
      const { createdBy, ...dataWithoutRelation } = data as any;
      const member = await this.prisma.teamMember.create({
        data: {
          ...dataWithoutRelation,
          createdById,
        } as Prisma.TeamMemberUncheckedCreateInput,
      });
      this.logger.log(`Created team member: ${member.id} by user: ${createdById}`);
      return member;
    } catch (error) {
      this.logger.error(`Error creating team member: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.TeamMemberUpdateInput, createdById: string): Promise<TeamMember> {
    try {
      // First verify the record belongs to the user
      const existing = await this.findOne(id, createdById);
      if (!existing) {
        throw new NotFoundException(`Team member with ID ${id} not found`);
      }

      const member = await this.prisma.teamMember.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated team member: ${id}`);
      return member;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member with ID ${id} not found`);
      }
      this.logger.error(`Error updating team member: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string, createdById: string): Promise<void> {
    try {
      // First verify the record belongs to the user
      const existing = await this.findOne(id, createdById);
      if (!existing) {
        throw new NotFoundException(`Team member with ID ${id} not found`);
      }

      await this.prisma.teamMember.delete({
        where: { id },
      });
      this.logger.log(`Deleted team member: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member with ID ${id} not found`);
      }
      this.logger.error(`Error deleting team member: ${error.message}`, error.stack);
      throw error;
    }
  }
}
