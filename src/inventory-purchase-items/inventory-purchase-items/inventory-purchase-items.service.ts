import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryPurchase, Prisma } from '@prisma/client';

@Injectable()
export class InventoryPurchaseItemsService {
  private readonly logger = new Logger(InventoryPurchaseItemsService.name);

  constructor(private prisma: PrismaService) {}

  // Get purchases by month/year - ported from storage.ts
  async findByMonth(month: number, year: number, userId: string): Promise<InventoryPurchase[]> {
    try {
      const allPurchases = await this.prisma.inventoryPurchase.findMany({
        where: { userId } as any,
        orderBy: { createdAt: 'desc' },
      });

      // Filter by month/year from purchasedAt string
      return allPurchases.filter((purchase) => {
        const purchaseDate = new Date(purchase.purchasedAt);
        return (
          purchaseDate.getMonth() + 1 === month &&
          purchaseDate.getFullYear() === year
        );
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory purchases by month: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Create single purchase - ported from storage.ts
  async create(data: Prisma.InventoryPurchaseCreateInput, userId: string): Promise<InventoryPurchase> {
    try {
      const { user, ...dataWithoutUser } = data as any;
      const purchase = await this.prisma.inventoryPurchase.create({
        data: {
          ...dataWithoutUser,
          user: { connect: { id: userId } }, // Use relation syntax as Prisma requires
        },
      });

      // Update inventory item's idealTotalInventory if itemId and quantity provided
      if (data.item?.connect?.id && typeof data.quantity === 'number') {
        const itemId = data.item.connect.id;
        const item = await this.prisma.inventory.findFirst({
          where: { id: itemId, userId } as any,
        });

        if (item) {
          const newIdealTotal = (item.idealTotalInventory || 0) + data.quantity;
          await this.prisma.inventory.update({
            where: { id: itemId },
            data: { idealTotalInventory: newIdealTotal },
          });
        }
      }

      return purchase;
    } catch (error) {
      this.logger.error(`Error creating inventory purchase: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Create multiple purchases - ported from storage.ts
  async createMany(purchases: Prisma.InventoryPurchaseCreateInput[], userId: string): Promise<InventoryPurchase[]> {
    try {
      const results: InventoryPurchase[] = [];
      for (const purchaseData of purchases) {
        const result = await this.create(purchaseData, userId);
        results.push(result);
      }
      return results;
    } catch (error) {
      this.logger.error(`Error creating multiple inventory purchases: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Update purchase - ported from storage.ts
  async update(id: string, data: Prisma.InventoryPurchaseUpdateInput, userId: string): Promise<InventoryPurchase> {
    try {
      // First verify the purchase belongs to the user
      const existing = await this.prisma.inventoryPurchase.findFirst({
        where: { id, userId } as any,
      });
      if (!existing) {
        throw new NotFoundException(`Inventory purchase with ID ${id} not found`);
      }

      const purchase = await this.prisma.inventoryPurchase.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated inventory purchase: ${id}`);
      return purchase;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory purchase with ID ${id} not found`);
      }
      this.logger.error(`Error updating inventory purchase: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Delete purchase - ported from storage.ts
  async delete(id: string, userId: string): Promise<void> {
    try {
      // First verify the purchase belongs to the user
      const existing = await this.prisma.inventoryPurchase.findFirst({
        where: { id, userId } as any,
      });
      if (!existing) {
        throw new NotFoundException(`Inventory purchase with ID ${id} not found`);
      }

      await this.prisma.inventoryPurchase.delete({
        where: { id },
      });
      this.logger.log(`Deleted inventory purchase: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory purchase with ID ${id} not found`);
      }
      this.logger.error(`Error deleting inventory purchase: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Delete purchases by orderId - ported from storage.ts
  async deleteByOrderId(orderId: string, userId: string): Promise<void> {
    try {
      await this.prisma.inventoryPurchase.deleteMany({
        where: { orderId, userId } as any,
      });
      this.logger.log(`Deleted inventory purchases for order: ${orderId}`);
    } catch (error) {
      this.logger.error(`Error deleting inventory purchases by orderId: ${error.message}`, error.stack);
      throw error;
    }
  }
}
