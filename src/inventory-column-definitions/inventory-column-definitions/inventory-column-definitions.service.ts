import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryColumnDefinition, Prisma } from '@prisma/client';

@Injectable()
export class InventoryColumnDefinitionsService {
  private readonly logger = new Logger(InventoryColumnDefinitionsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<InventoryColumnDefinition[]> {
    try {
      return this.prisma.inventoryColumnDefinition.findMany({
        where: { userId },
        orderBy: { displayOrder: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory column definitions: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<InventoryColumnDefinition | null> {
    try {
      const column = await this.prisma.inventoryColumnDefinition.findUnique({
        where: { id },
      });

      if (!column) {
        return null;
      }

      if (column.userId !== userId) {
        throw new NotFoundException(`Inventory column definition with ID ${id} not found`);
      }

      return column;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching inventory column definition: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(data: {
    columnKey: string;
    columnLabel: string;
    displayOrder?: number;
    isVisible?: boolean;
  }, userId: string): Promise<InventoryColumnDefinition> {
    try {
      const column = await this.prisma.inventoryColumnDefinition.create({
        data: {
          userId,
          columnKey: data.columnKey,
          columnLabel: data.columnLabel,
          displayOrder: data.displayOrder ?? 0,
          isVisible: data.isVisible !== false,
        },
      });
      this.logger.log(`Created inventory column definition: ${column.id}`);
      return column;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error(`Column with key "${data.columnKey}" already exists for this user`);
      }
      this.logger.error(`Error creating inventory column definition: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: {
    columnLabel?: string;
    displayOrder?: number;
    isVisible?: boolean;
  }, userId: string): Promise<InventoryColumnDefinition> {
    try {
      // Verify ownership
      const existing = await this.findOne(id, userId);
      if (!existing) {
        throw new NotFoundException(`Inventory column definition with ID ${id} not found`);
      }

      const column = await this.prisma.inventoryColumnDefinition.update({
        where: { id },
        data: {
          ...(data.columnLabel !== undefined && { columnLabel: data.columnLabel }),
          ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
          ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
        },
      });
      this.logger.log(`Updated inventory column definition: ${id}`);
      return column;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory column definition with ID ${id} not found`);
      }
      this.logger.error(`Error updating inventory column definition: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const existing = await this.findOne(id, userId);
      if (!existing) {
        throw new NotFoundException(`Inventory column definition with ID ${id} not found`);
      }

      await this.prisma.inventoryColumnDefinition.delete({
        where: { id },
      });
      this.logger.log(`Deleted inventory column definition: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory column definition with ID ${id} not found`);
      }
      this.logger.error(`Error deleting inventory column definition: ${error.message}`, error.stack);
      throw error;
    }
  }

  async reorder(updates: Array<{ id: string; displayOrder: number }>, userId: string): Promise<InventoryColumnDefinition[]> {
    try {
      // Verify all columns belong to the user
      const columnIds = updates.map(u => u.id);
      const userColumns = await this.findAll(userId);
      const userColumnIds = userColumns.map(c => c.id);
      
      const invalidIds = columnIds.filter(id => !userColumnIds.includes(id));
      if (invalidIds.length > 0) {
        throw new Error(`Some column IDs do not belong to the user: ${invalidIds.join(', ')}`);
      }

      // Update all columns
      const results = await Promise.all(
        updates.map(update =>
          this.prisma.inventoryColumnDefinition.update({
            where: { id: update.id },
            data: { displayOrder: update.displayOrder },
          })
        )
      );

      this.logger.log(`Reordered ${results.length} inventory column definitions`);
      return results;
    } catch (error) {
      this.logger.error(`Error reordering inventory column definitions: ${error.message}`, error.stack);
      throw error;
    }
  }
}
