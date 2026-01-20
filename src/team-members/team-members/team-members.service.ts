import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TeamMember, Prisma } from '@prisma/client';

@Injectable()
export class TeamMembersService {
  private readonly logger = new Logger(TeamMembersService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<TeamMember[]> {
    return this.prisma.teamMember.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<TeamMember | null> {
    return this.prisma.teamMember.findUnique({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return this.prisma.teamMember.count();
  }

  async create(data: Prisma.TeamMemberCreateInput): Promise<TeamMember> {
    try {
      const member = await this.prisma.teamMember.create({
        data,
      });
      this.logger.log(`Created team member: ${member.id}`);
      return member;
    } catch (error) {
      this.logger.error(`Error creating team member: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.TeamMemberUpdateInput): Promise<TeamMember> {
    try {
      const member = await this.prisma.teamMember.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated team member: ${id}`);
      return member;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member with ID ${id} not found`);
      }
      this.logger.error(`Error updating team member: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.teamMember.delete({
        where: { id },
      });
      this.logger.log(`Deleted team member: ${id}`);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team member with ID ${id} not found`);
      }
      this.logger.error(`Error deleting team member: ${error.message}`, error.stack);
      throw error;
    }
  }
}
