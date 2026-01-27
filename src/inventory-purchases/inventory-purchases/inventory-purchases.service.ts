import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryTechnicianPurchase, Prisma } from '@prisma/client';

@Injectable()
export class InventoryPurchasesService {
  private readonly logger = new Logger(InventoryPurchasesService.name);

  constructor(private prisma: PrismaService) {}

  async findAllByTeamMember(technicianId: string, userId: string, year?: number): Promise<InventoryTechnicianPurchase[]> {
    try {
      // Fetch all purchases for the technician (filtered by userId for security)
      const purchases = await this.prisma.inventoryTechnicianPurchase.findMany({
        where: {
          technicianId,
          userId,
        },
        orderBy: { createdAt: 'desc' },
      });

      // If year is provided, filter by year in purchaseDate (MM/DD/YYYY format)
      // Use string matching like Replit implementation since purchaseDate is stored as text
      if (year !== undefined) {
        const yearStr = year.toString();
        return purchases.filter((p) => {
          const dateStr = p.purchaseDate;
          // Check if the year string is included in the date string
          // This works for MM/DD/YYYY format where year is at the end
          return dateStr.includes(yearStr);
        });
      }

      return purchases;
    } catch (error) {
      this.logger.error(`Error fetching inventory purchases: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.InventoryTechnicianPurchaseUpdateInput, userId: string): Promise<InventoryTechnicianPurchase> {
    try {
      // First verify the purchase belongs to the user
      const existing = await this.prisma.inventoryTechnicianPurchase.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new NotFoundException(`Inventory technician purchase with ID ${id} not found`);
      }

      const purchase = await this.prisma.inventoryTechnicianPurchase.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated inventory technician purchase: ${id}`);
      return purchase;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory technician purchase with ID ${id} not found`);
      }
      this.logger.error(`Error updating inventory technician purchase: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.inventoryTechnicianPurchase.delete({
        where: { id },
      });
      this.logger.log(`Deleted inventory purchase: ${id}`);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory purchase with ID ${id} not found`);
      }
      this.logger.error(`Error deleting inventory purchase: ${error.message}`, error.stack);
      throw error;
    }
  }
}
