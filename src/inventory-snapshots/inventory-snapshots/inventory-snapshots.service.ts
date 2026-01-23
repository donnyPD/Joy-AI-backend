import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventorySnapshot, Prisma } from '@prisma/client';

export interface InventorySnapshotItem {
  name: string;
  type: string;
  totalRequested: number;
  totalInventory: number;
  pricePerUnit: string | null;
  threshold: number;
  rowNumber: number | null;
}

@Injectable()
export class InventorySnapshotsService {
  private readonly logger = new Logger(InventorySnapshotsService.name);

  constructor(private prisma: PrismaService) {}

  // Ported from storage.ts: getInventorySnapshot
  async findByMonthYear(month: number, year: number, userId: string): Promise<InventorySnapshot | null> {
    try {
      // Use findFirst since userId is nullable and unique constraint might not work as expected
      return this.prisma.inventorySnapshot.findFirst({
        where: {
          userId: userId,
          month: month,
          year: year,
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory snapshot: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: createInventorySnapshot
  async create(
    month: number,
    year: number,
    snapshotData: InventorySnapshotItem[],
    userId: string,
  ): Promise<InventorySnapshot> {
    try {
      // Check if snapshot already exists
      const existing = await this.findByMonthYear(month, year, userId);
      if (existing) {
        return existing;
      }

      const snapshot = await this.prisma.inventorySnapshot.create({
        data: {
          month,
          year,
          snapshotData: snapshotData as any, // Prisma Json type
          user: { connect: { id: userId } }, // Use relation syntax as Prisma requires
        },
      });
      this.logger.log(`Created inventory snapshot for ${month}/${year}`);
      return snapshot;
    } catch (error) {
      this.logger.error(`Error creating inventory snapshot: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: getAvailableSnapshotMonths
  async getAvailableMonths(userId: string): Promise<Array<{ month: number; year: number }>> {
    try {
      const snapshots = await this.prisma.inventorySnapshot.findMany({
        where: { userId },
        select: {
          month: true,
          year: true,
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
        ],
      });
      return snapshots;
    } catch (error) {
      this.logger.error(`Error fetching available snapshot months: ${error.message}`, error.stack);
      throw error;
    }
  }
}
