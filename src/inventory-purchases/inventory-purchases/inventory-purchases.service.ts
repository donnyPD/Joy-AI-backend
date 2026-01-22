import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryTechnicianPurchase, Prisma } from '@prisma/client';

@Injectable()
export class InventoryPurchasesService {
  private readonly logger = new Logger(InventoryPurchasesService.name);

  constructor(private prisma: PrismaService) {}

  async findAllByTeamMember(technicianId: string, year?: number): Promise<InventoryTechnicianPurchase[]> {
    try {
      const where: Prisma.InventoryTechnicianPurchaseWhereInput = {
        technicianId,
      };

      // If year is provided, filter by year in purchaseDate
      if (year !== undefined) {
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;
        where.purchaseDate = {
          gte: yearStart,
          lte: yearEnd,
        };
      }

      return this.prisma.inventoryTechnicianPurchase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory purchases: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.InventoryTechnicianPurchaseUpdateInput): Promise<InventoryTechnicianPurchase> {
    try {
      const purchase = await this.prisma.inventoryTechnicianPurchase.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated inventory purchase: ${id}`);
      return purchase;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory purchase with ID ${id} not found`);
      }
      this.logger.error(`Error updating inventory purchase: ${error.message}`, error.stack);
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
