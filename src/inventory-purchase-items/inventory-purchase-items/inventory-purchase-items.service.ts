import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryPurchase, Prisma } from '@prisma/client';

@Injectable()
export class InventoryPurchaseItemsService {
  private readonly logger = new Logger(InventoryPurchaseItemsService.name);

  constructor(private prisma: PrismaService) {}

  // Get purchases by month/year - ported from storage.ts
  async findByMonth(month: number, year: number): Promise<InventoryPurchase[]> {
    try {
      const allPurchases = await this.prisma.inventoryPurchase.findMany({
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
  async create(data: Prisma.InventoryPurchaseCreateInput): Promise<InventoryPurchase> {
    try {
      const purchase = await this.prisma.inventoryPurchase.create({
        data,
      });

      // Update inventory item's idealTotalInventory if itemId and quantity provided
      if (data.item?.connect?.id && typeof data.quantity === 'number') {
        const itemId = data.item.connect.id;
        const item = await this.prisma.inventory.findUnique({
          where: { id: itemId },
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
  async createMany(purchases: Prisma.InventoryPurchaseCreateInput[]): Promise<InventoryPurchase[]> {
    try {
      const results: InventoryPurchase[] = [];
      for (const purchaseData of purchases) {
        const result = await this.create(purchaseData);
        results.push(result);
      }
      return results;
    } catch (error) {
      this.logger.error(`Error creating multiple inventory purchases: ${error.message}`, error.stack);
      throw error;
    }
  }
}
