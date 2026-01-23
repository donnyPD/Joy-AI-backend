import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Inventory, Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  // Ported from storage.ts: getAllInventory
  async findAll(userId: string): Promise<Inventory[]> {
    try {
      return this.prisma.inventory.findMany({
        where: { userId },
        orderBy: { rowNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching all inventory: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getInventoryByType
  async findByType(type: string, userId: string): Promise<Inventory[]> {
    try {
      return this.prisma.inventory.findMany({
        where: { type, userId },
        orderBy: { rowNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory by type: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getInventoryByCategory
  async findByCategory(categoryId: string, userId: string): Promise<Inventory[]> {
    try {
      return this.prisma.inventory.findMany({
        where: { categoryId, userId },
        orderBy: { rowNumber: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory by category: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getInventoryItem
  async findOne(id: string, userId: string): Promise<Inventory | null> {
    try {
      return this.prisma.inventory.findFirst({
        where: { id, userId },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory item: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getInventoryByName
  async findByName(name: string, userId: string): Promise<Inventory | null> {
    try {
      return this.prisma.inventory.findFirst({
        where: { name, userId },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory by name: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: findInventoryByFlexibleMatch
  async findByFlexibleMatch(incomingName: string, userId: string): Promise<Inventory | null> {
    try {
      const allItems = await this.findAll(userId);

      const normalize = (str: string): string => {
        return str
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/\(\s+/g, '(')
          .replace(/\s+\)/g, ')')
          .replace(/(\d+)\s*(oz|ct|ga|gallon)/gi, '$1$2')
          .replace(/['']/g, "'");
      };

      const extractKeyTerms = (str: string): string[] => {
        return normalize(str)
          .split(/[\s\-,()]+/)
          .filter((term) => term.length > 2)
          .filter(
            (term) =>
              !['the', 'and', 'with', 'for', 'per', 'pack', 'of'].includes(term),
          );
      };

      const normalizedIncoming = normalize(incomingName);

      for (const item of allItems) {
        if (normalize(item.name) === normalizedIncoming) {
          return item;
        }
      }

      for (const item of allItems) {
        const normalizedFixed = normalize(item.name);
        if (
          normalizedFixed.includes(normalizedIncoming) ||
          normalizedIncoming.includes(normalizedFixed)
        ) {
          return item;
        }
      }

      const incomingTerms = extractKeyTerms(incomingName);
      let bestMatch: Inventory | null = null;
      let bestScore = 0;

      for (const item of allItems) {
        const fixedTerms = extractKeyTerms(item.name);
        let matchCount = 0;

        for (const inTerm of incomingTerms) {
          for (const fixTerm of fixedTerms) {
            if (
              inTerm === fixTerm ||
              inTerm.includes(fixTerm) ||
              fixTerm.includes(inTerm)
            ) {
              matchCount++;
              break;
            }
          }
        }

        const score =
          matchCount / Math.max(incomingTerms.length, fixedTerms.length);
        if (score > 0.6 && score > bestScore) {
          bestScore = score;
          bestMatch = item;
        }
      }

      return bestMatch;
    } catch (error) {
      this.logger.error(`Error finding inventory by flexible match: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: createInventoryItem
  async create(data: Prisma.InventoryCreateInput, userId: string): Promise<Inventory> {
    try {
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        this.logger.error(`Invalid userId provided: ${userId}`);
        throw new Error('Valid userId is required to create inventory item');
      }
      // Extract user field if present to avoid conflicts, then set it properly
      const { user, ...dataWithoutUser } = data as any;
      const item = await this.prisma.inventory.create({
        data: {
          ...dataWithoutUser,
          user: { connect: { id: userId } }, // Use relation syntax as Prisma requires
        },
      });
      this.logger.log(`Created inventory item ${item.id} for user ${userId}`);
      return item;
    } catch (error) {
      this.logger.error(`Error creating inventory item for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: createInventoryItems
  async createMany(data: Prisma.InventoryCreateInput[], userId: string): Promise<Inventory[]> {
    try {
      if (data.length === 0) {
        return [];
      }
      // Prisma doesn't support createMany with returning, so we use Promise.all
      const items = await Promise.all(
        data.map((item) => {
          const { user, ...itemWithoutUser } = item as any;
          return this.prisma.inventory.create({ 
            data: {
              ...itemWithoutUser,
              user: { connect: { id: userId } }, // Use relation syntax as Prisma requires
            },
          });
        })
      );
      this.logger.log(`Created ${items.length} inventory items`);
      return items;
    } catch (error) {
      this.logger.error(`Error creating inventory items: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: updateInventoryItem
  async update(id: string, data: Prisma.InventoryUpdateInput, userId: string): Promise<Inventory> {
    try {
      // First verify the item belongs to the user
      const existing = await this.findOne(id, userId);
      if (!existing) {
        throw new NotFoundException(`Inventory item with ID ${id} not found`);
      }

      const item = await this.prisma.inventory.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated inventory item: ${id}`);
      return item;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory item with ID ${id} not found`);
      }
      this.logger.error(`Error updating inventory item: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: deleteInventoryItem
  async delete(id: string, userId: string): Promise<void> {
    try {
      // First verify the item belongs to the user
      const existing = await this.findOne(id, userId);
      if (!existing) {
        throw new NotFoundException(`Inventory item with ID ${id} not found`);
      }

      await this.prisma.inventory.delete({
        where: { id },
      });
      this.logger.log(`Deleted inventory item: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory item with ID ${id} not found`);
      }
      this.logger.error(`Error deleting inventory item: ${error.message}`, error.stack);
      throw error;
    }
  }
}
