import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryFormConfig, Prisma } from '@prisma/client';

@Injectable()
export class InventoryFormConfigService {
  private readonly logger = new Logger(InventoryFormConfigService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<InventoryFormConfig[]> {
    try {
      return this.prisma.inventoryFormConfig.findMany({
        where: { userId },
        orderBy: { displayOrder: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching all inventory form config: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByCategory(categoryName: string, userId: string): Promise<InventoryFormConfig[]> {
    try {
      return this.prisma.inventoryFormConfig.findMany({
        where: { categoryName, userId },
        orderBy: { displayOrder: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory form config by category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async upsert(data: {
    fieldName: string;
    fieldType?: string;
    categoryName: string;
    isVisible?: boolean;
    isRequired?: boolean;
    dropdownMin?: number;
    dropdownMaxByType?: Record<string, number>;
    displayOrder?: number;
  }, userId: string): Promise<InventoryFormConfig> {
    try {
      const existing = await this.prisma.inventoryFormConfig.findFirst({
        where: {
          fieldName: data.fieldName,
          categoryName: data.categoryName,
          userId,
        },
      });

      // Default dropdownMaxByType if not provided
      const defaultDropdownMaxByType = { '1099': 5, 'W2': 5 };
      const dropdownMaxByType = data.dropdownMaxByType || defaultDropdownMaxByType;

      if (existing) {
        // Merge with existing values if partial update
        const existingMaxByType = (existing.dropdownMaxByType as Record<string, number>) || defaultDropdownMaxByType;
        const mergedMaxByType = data.dropdownMaxByType 
          ? { ...existingMaxByType, ...data.dropdownMaxByType }
          : existingMaxByType;

        return this.prisma.inventoryFormConfig.update({
          where: { id: existing.id },
          data: {
            fieldType: data.fieldType || existing.fieldType,
            isVisible: data.isVisible !== undefined ? data.isVisible : existing.isVisible,
            isRequired: data.isRequired !== undefined ? data.isRequired : existing.isRequired,
            dropdownMin: data.dropdownMin !== undefined ? data.dropdownMin : existing.dropdownMin,
            dropdownMaxByType: mergedMaxByType,
            displayOrder: data.displayOrder !== undefined ? data.displayOrder : existing.displayOrder,
          },
        });
      } else {
        return this.prisma.inventoryFormConfig.create({
          data: {
            fieldName: data.fieldName,
            fieldType: data.fieldType || 'dropdown',
            categoryName: data.categoryName,
            isVisible: data.isVisible !== false,
            isRequired: data.isRequired === true,
            dropdownMin: data.dropdownMin || 1,
            dropdownMaxByType: dropdownMaxByType,
            displayOrder: data.displayOrder || 0,
            user: { connect: { id: userId } }, // Use relation syntax as Prisma requires
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error upserting inventory form config: ${error.message}`, error.stack);
      throw error;
    }
  }

  async bulkUpsert(configs: Array<{
    fieldName: string;
    fieldType?: string;
    categoryName: string;
    isVisible?: boolean;
    isRequired?: boolean;
    dropdownMin?: number;
    dropdownMaxByType?: Record<string, number>;
    displayOrder?: number;
  }>, userId: string): Promise<InventoryFormConfig[]> {
    try {
      const results = await Promise.all(
        configs.map(config => this.upsert(config, userId))
      );
      return results;
    } catch (error) {
      this.logger.error(`Error bulk upserting inventory form config: ${error.message}`, error.stack);
      throw error;
    }
  }
}
