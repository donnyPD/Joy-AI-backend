import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryCategory, Prisma } from '@prisma/client';

@Injectable()
export class InventoryCategoriesService {
  private readonly logger = new Logger(InventoryCategoriesService.name);

  constructor(private prisma: PrismaService) {}

  // Ported from storage.ts: getAllInventoryCategories
  async findAll(): Promise<InventoryCategory[]> {
    try {
      return this.prisma.inventoryCategory.findMany({
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getInventoryCategory
  async findOne(id: string): Promise<InventoryCategory | null> {
    try {
      return this.prisma.inventoryCategory.findUnique({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory category: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getInventoryCategoryByName
  async findByName(name: string): Promise<InventoryCategory | null> {
    try {
      return this.prisma.inventoryCategory.findUnique({
        where: { name },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory category by name: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: createInventoryCategory
  async create(data: Prisma.InventoryCategoryCreateInput): Promise<InventoryCategory> {
    try {
      const category = await this.prisma.inventoryCategory.create({
        data,
      });
      this.logger.log(`Created inventory category: ${category.id}`);
      return category;
    } catch (error) {
      this.logger.error(`Error creating inventory category: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: updateInventoryCategory
  async update(id: string, data: Prisma.InventoryCategoryUpdateInput): Promise<InventoryCategory> {
    try {
      const category = await this.prisma.inventoryCategory.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated inventory category: ${id}`);
      return category;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory category with ID ${id} not found`);
      }
      this.logger.error(`Error updating inventory category: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: deleteInventoryCategory
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.inventoryCategory.delete({
        where: { id },
      });
      this.logger.log(`Deleted inventory category: ${id}`);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory category with ID ${id} not found`);
      }
      this.logger.error(`Error deleting inventory category: ${error.message}`, error.stack);
      throw error;
    }
  }
}
