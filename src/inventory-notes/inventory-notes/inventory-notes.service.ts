import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryNote, Prisma } from '@prisma/client';

@Injectable()
export class InventoryNotesService {
  private readonly logger = new Logger(InventoryNotesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<InventoryNote[]> {
    try {
      return this.prisma.inventoryNote.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching all inventory notes: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllByTeamMember(teamMemberId: string, userId: string): Promise<InventoryNote[]> {
    try {
      return this.prisma.inventoryNote.findMany({
        where: { teamMemberId, userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory notes: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(data: Prisma.InventoryNoteCreateInput, userId: string): Promise<InventoryNote> {
    try {
      // Ensure nyTimestamp is always present - generate if missing
      if (!data.nyTimestamp) {
        const now = new Date();
        const nyFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        data.nyTimestamp = nyFormatter.format(now);
      }

      const { user, ...dataWithoutUser } = data as any;
      const note = await this.prisma.inventoryNote.create({
        data: {
          ...dataWithoutUser,
          user: { connect: { id: userId } }, // Use relation syntax as Prisma requires
        },
      });
      this.logger.log(`Created inventory note: ${note.id}`);
      return note;
    } catch (error) {
      this.logger.error(`Error creating inventory note: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.InventoryNoteUpdateInput, userId: string): Promise<InventoryNote> {
    try {
      // First verify the note belongs to the user
      const existing = await this.prisma.inventoryNote.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new NotFoundException(`Inventory note with ID ${id} not found`);
      }

      const note = await this.prisma.inventoryNote.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated inventory note: ${id}`);
      return note;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory note with ID ${id} not found`);
      }
      this.logger.error(`Error updating inventory note: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    try {
      // First verify the note belongs to the user
      const existing = await this.prisma.inventoryNote.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new NotFoundException(`Inventory note with ID ${id} not found`);
      }

      await this.prisma.inventoryNote.delete({
        where: { id },
      });
      this.logger.log(`Deleted inventory note: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory note with ID ${id} not found`);
      }
      this.logger.error(`Error deleting inventory note: ${error.message}`, error.stack);
      throw error;
    }
  }
}
