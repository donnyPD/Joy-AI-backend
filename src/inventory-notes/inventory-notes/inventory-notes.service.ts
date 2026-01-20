import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryNote, Prisma } from '@prisma/client';

@Injectable()
export class InventoryNotesService {
  private readonly logger = new Logger(InventoryNotesService.name);

  constructor(private prisma: PrismaService) {}

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
}
