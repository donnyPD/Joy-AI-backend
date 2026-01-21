import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryNote, Prisma } from '@prisma/client';

@Injectable()
export class InventoryNotesService {
  private readonly logger = new Logger(InventoryNotesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<InventoryNote[]> {
    try {
      return this.prisma.inventoryNote.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching all inventory notes: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllByTeamMember(teamMemberId: string): Promise<InventoryNote[]> {
    try {
      return this.prisma.inventoryNote.findMany({
        where: { teamMemberId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory notes: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(data: Prisma.InventoryNoteCreateInput): Promise<InventoryNote> {
    try {
      const note = await this.prisma.inventoryNote.create({
        data,
      });
      this.logger.log(`Created inventory note: ${note.id}`);
      return note;
    } catch (error) {
      this.logger.error(`Error creating inventory note: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.InventoryNoteUpdateInput): Promise<InventoryNote> {
    try {
      const note = await this.prisma.inventoryNote.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated inventory note: ${id}`);
      return note;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory note with ID ${id} not found`);
      }
      this.logger.error(`Error updating inventory note: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.inventoryNote.delete({
        where: { id },
      });
      this.logger.log(`Deleted inventory note: ${id}`);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory note with ID ${id} not found`);
      }
      this.logger.error(`Error deleting inventory note: ${error.message}`, error.stack);
      throw error;
    }
  }
}
