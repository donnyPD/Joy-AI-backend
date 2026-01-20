import { Injectable, Logger } from '@nestjs/common';
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
}
