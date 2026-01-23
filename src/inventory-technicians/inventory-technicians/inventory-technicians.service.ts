import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryTechnician, InventoryTechnicianPurchase, Prisma } from '@prisma/client';

@Injectable()
export class InventoryTechniciansService {
  private readonly logger = new Logger(InventoryTechniciansService.name);

  constructor(private prisma: PrismaService) {}

  // Ported from storage.ts: getAllInventoryTechnicians
  async findAll(userId: string): Promise<InventoryTechnician[]> {
    try {
      return this.prisma.inventoryTechnician.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory technicians: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getInventoryTechnician
  async findOne(id: string, userId: string): Promise<InventoryTechnician | null> {
    try {
      return this.prisma.inventoryTechnician.findFirst({
        where: { id, userId },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory technician: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getInventoryTechnicianByName
  async findByName(techName: string, userId: string): Promise<InventoryTechnician | null> {
    try {
      return this.prisma.inventoryTechnician.findUnique({
        where: { userId_techName: { userId, techName } },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory technician by name: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: createInventoryTechnician
  async create(data: Prisma.InventoryTechnicianCreateInput, userId: string): Promise<InventoryTechnician> {
    try {
      const { user, ...dataWithoutUser } = data as any;
      const tech = await this.prisma.inventoryTechnician.create({
        data: {
          ...dataWithoutUser,
          user: { connect: { id: userId } }, // Use relation syntax as Prisma requires
        },
      });
      this.logger.log(`Created inventory technician: ${tech.id}`);
      return tech;
    } catch (error) {
      this.logger.error(`Error creating inventory technician: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: updateInventoryTechnician
  async update(id: string, data: Prisma.InventoryTechnicianUpdateInput, userId: string): Promise<InventoryTechnician> {
    try {
      // First verify the technician belongs to the user
      const existing = await this.findOne(id, userId);
      if (!existing) {
        throw new NotFoundException(`Inventory technician with ID ${id} not found`);
      }

      const tech = await this.prisma.inventoryTechnician.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated inventory technician: ${id}`);
      return tech;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory technician with ID ${id} not found`);
      }
      this.logger.error(`Error updating inventory technician: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getTechnicianPurchases
  async getTechnicianPurchases(technicianId: string, userId: string): Promise<InventoryTechnicianPurchase[]> {
    try {
      // First verify the technician belongs to the user
      const tech = await this.prisma.inventoryTechnician.findFirst({
        where: { id: technicianId, userId },
      });
      if (!tech) {
        return [];
      }

      return this.prisma.inventoryTechnicianPurchase.findMany({
        where: { technicianId, userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching technician purchases: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: createTechnicianPurchase
  async createTechnicianPurchase(data: Prisma.InventoryTechnicianPurchaseCreateInput, userId: string): Promise<InventoryTechnicianPurchase> {
    try {
      const { user, ...dataWithoutUser } = data as any;
      const purchase = await this.prisma.inventoryTechnicianPurchase.create({
        data: {
          ...dataWithoutUser,
          user: { connect: { id: userId } }, // Use relation syntax as Prisma requires
        },
      });
      this.logger.log(`Created technician purchase: ${purchase.id}`);
      return purchase;
    } catch (error) {
      this.logger.error(`Error creating technician purchase: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getLatestTechnicianPurchases
  async getLatestTechnicianPurchases(userId: string, includeHidden = false): Promise<
    Array<
      InventoryTechnician & {
        latestPurchase: InventoryTechnicianPurchase | null;
      }
    >
  > {
    try {
      const technicians = await this.prisma.inventoryTechnician.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const monthName = monthNames[currentMonth - 1];

      const result = await Promise.all(
        technicians.map(async (tech) => {
          const purchases = await this.prisma.inventoryTechnicianPurchase.findMany({
            where: { technicianId: tech.id, userId },
            orderBy: { createdAt: 'desc' },
          });

          const filteredPurchase = purchases.find((p) => {
            const dateStr = p.purchaseDate;
            const matchesMonth =
              dateStr.includes(monthName) &&
              dateStr.includes(currentYear.toString());
            return matchesMonth && (includeHidden || !p.isCompleted);
          });

          return { ...tech, latestPurchase: filteredPurchase || null };
        }),
      );

      return result.filter((r) => r.latestPurchase !== null);
    } catch (error) {
      this.logger.error(`Error fetching latest technician purchases: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getTechnicianPurchasesByMonth
  async getTechnicianPurchasesByMonth(
    month: number,
    year: number,
    userId: string,
    includeHidden = false,
  ): Promise<
    Array<
      InventoryTechnician & {
        latestPurchase: InventoryTechnicianPurchase | null;
      }
    >
  > {
    try {
      const technicians = await this.prisma.inventoryTechnician.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const monthName = monthNames[month - 1];

      const result = await Promise.all(
        technicians.map(async (tech) => {
          const purchases = await this.prisma.inventoryTechnicianPurchase.findMany({
            where: { technicianId: tech.id, userId },
            orderBy: { createdAt: 'desc' },
          });

          const filteredPurchase = purchases.find((p) => {
            const dateStr = p.purchaseDate;
            const matchesMonth =
              dateStr.includes(monthName) && dateStr.includes(year.toString());
            return matchesMonth && (includeHidden || !p.isCompleted);
          });

          return { ...tech, latestPurchase: filteredPurchase || null };
        }),
      );

      return result.filter((r) => r.latestPurchase !== null);
    } catch (error) {
      this.logger.error(`Error fetching technician purchases by month: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: markPurchaseCompleted
  async markPurchaseCompleted(purchaseId: string, userId: string): Promise<InventoryTechnicianPurchase> {
    try {
      // First verify the purchase belongs to the user
      const existing = await this.prisma.inventoryTechnicianPurchase.findFirst({
        where: { id: purchaseId, userId },
      });
      if (!existing) {
        throw new NotFoundException(`Purchase with ID ${purchaseId} not found`);
      }

      const purchase = await this.prisma.inventoryTechnicianPurchase.update({
        where: { id: purchaseId },
        data: { isCompleted: true },
      });
      this.logger.log(`Marked purchase as completed: ${purchaseId}`);
      return purchase;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Purchase with ID ${purchaseId} not found`);
      }
      this.logger.error(`Error marking purchase as completed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: markPurchaseUncompleted
  async markPurchaseUncompleted(purchaseId: string, userId: string): Promise<InventoryTechnicianPurchase> {
    try {
      // First verify the purchase belongs to the user
      const existing = await this.prisma.inventoryTechnicianPurchase.findFirst({
        where: { id: purchaseId, userId },
      });
      if (!existing) {
        throw new NotFoundException(`Purchase with ID ${purchaseId} not found`);
      }

      const purchase = await this.prisma.inventoryTechnicianPurchase.update({
        where: { id: purchaseId },
        data: { isCompleted: false },
      });
      this.logger.log(`Marked purchase as uncompleted: ${purchaseId}`);
      return purchase;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Purchase with ID ${purchaseId} not found`);
      }
      this.logger.error(`Error marking purchase as uncompleted: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: markAllTechnicianPurchasesCompletedForMonth
  async markAllTechnicianPurchasesCompletedForMonth(
    technicianId: string,
    month: number,
    year: number,
    userId: string,
  ): Promise<InventoryTechnicianPurchase[]> {
    try {
      // First verify the technician belongs to the user
      const tech = await this.prisma.inventoryTechnician.findFirst({
        where: { id: technicianId, userId },
      });
      if (!tech) {
        throw new NotFoundException(`Technician with ID ${technicianId} not found`);
      }

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const monthName = monthNames[month - 1];

      const allPurchases = await this.prisma.inventoryTechnicianPurchase.findMany({
        where: {
          technicianId,
          userId,
          isCompleted: false,
        },
      });

      const purchaseIdsToComplete = allPurchases
        .filter((p) => {
          const dateStr = p.purchaseDate;
          return dateStr.includes(monthName) && dateStr.includes(year.toString());
        })
        .map((p) => p.id);

      if (purchaseIdsToComplete.length === 0) {
        return [];
      }

      // Prisma doesn't support updateMany with returning, so we use Promise.all
      const completedPurchases = await Promise.all(
        purchaseIdsToComplete.map((id) =>
          this.prisma.inventoryTechnicianPurchase.update({
            where: { id },
            data: { isCompleted: true },
          })
        )
      );

      this.logger.log(`Marked ${completedPurchases.length} purchases as completed for technician ${technicianId}`);
      return completedPurchases;
    } catch (error) {
      this.logger.error(`Error marking all purchases as completed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getAllTechnicianPurchases
  async getAllTechnicianPurchases(userId: string, includeCompleted = false): Promise<InventoryTechnicianPurchase[]> {
    try {
      if (includeCompleted) {
        return this.prisma.inventoryTechnicianPurchase.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
      }
      return this.prisma.inventoryTechnicianPurchase.findMany({
        where: { userId, isCompleted: false },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching all technician purchases: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getAllPurchasesForMonth
  async getAllPurchasesForMonth(month: number, year: number, userId: string): Promise<InventoryTechnicianPurchase[]> {
    try {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const monthName = monthNames[month - 1];

      const allPurchases = await this.prisma.inventoryTechnicianPurchase.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return allPurchases.filter((p) => {
        const dateStr = p.purchaseDate;
        return dateStr.includes(monthName) && dateStr.includes(year.toString());
      });
    } catch (error) {
      this.logger.error(`Error fetching purchases for month: ${error.message}`, error.stack);
      throw error;
    }
  }
}
