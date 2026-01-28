import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryCategory, Prisma } from '@prisma/client';
import { InventoryService } from '../../inventory/inventory/inventory.service';

@Injectable()
export class InventoryCategoriesService {
  private readonly logger = new Logger(InventoryCategoriesService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => InventoryService))
    private inventoryService: InventoryService,
  ) {}

  // Ported from storage.ts: getAllInventoryCategories
  async findAll(userId: string): Promise<InventoryCategory[]> {
    try {
      return this.prisma.inventoryCategory.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getInventoryCategory
  async findOne(id: string, userId: string): Promise<InventoryCategory | null> {
    try {
      return this.prisma.inventoryCategory.findFirst({
        where: { id, userId },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory category: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getInventoryCategoryByName
  async findByName(name: string, userId: string): Promise<InventoryCategory | null> {
    try {
      return this.prisma.inventoryCategory.findUnique({
        where: { userId_name: { userId, name } },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory category by name: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: createInventoryCategory
  async create(data: Prisma.InventoryCategoryCreateInput, userId: string): Promise<InventoryCategory> {
    try {
      const { user, ...dataWithoutUser } = data as any;
      const categoryName = (dataWithoutUser.name as string)?.trim();
      
      // Check if category with same name already exists for this user
      if (categoryName) {
        const existing = await this.findByName(categoryName, userId);
        if (existing) {
          throw new BadRequestException(`A category with the name "${categoryName}" already exists. Please choose a different name.`);
        }
      }

      const category = await this.prisma.inventoryCategory.create({
        data: {
          ...dataWithoutUser,
          user: { connect: { id: userId } }, // Use relation syntax as Prisma requires
        },
      });
      this.logger.log(`Created inventory category: ${category.id}`);
      return category;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Handle Prisma unique constraint violation as fallback
      if (error.code === 'P2002') {
        const categoryName = (data as any).name?.trim() || 'this name';
        throw new BadRequestException(`A category with the name "${categoryName}" already exists. Please choose a different name.`);
      }
      this.logger.error(`Error creating inventory category: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: updateInventoryCategory
  async update(id: string, data: Prisma.InventoryCategoryUpdateInput, userId: string): Promise<InventoryCategory> {
    try {
      // First verify the category belongs to the user
      const existing = await this.findOne(id, userId);
      if (!existing) {
        throw new NotFoundException(`Inventory category with ID ${id} not found`);
      }

      const category = await this.prisma.inventoryCategory.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated inventory category: ${id}`);
      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory category with ID ${id} not found`);
      }
      this.logger.error(`Error updating inventory category: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: deleteInventoryCategory
  async delete(id: string, userId: string): Promise<void> {
    try {
      // First verify the category belongs to the user
      const existing = await this.findOne(id, userId);
      if (!existing) {
        throw new NotFoundException(`Inventory category with ID ${id} not found`);
      }

      // Check if category has items
      const items = await this.inventoryService.findByCategory(id, userId);
      if (items.length > 0) {
        throw new BadRequestException(
          `Cannot delete category "${existing.name}". Please delete all items in this category first.`
        );
      }

      await this.prisma.inventoryCategory.delete({
        where: { id },
      });
      this.logger.log(`Deleted inventory category: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory category with ID ${id} not found`);
      }
      this.logger.error(`Error deleting inventory category: ${error.message}`, error.stack);
      throw error;
    }
  }
}
