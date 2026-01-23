import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryStore, Prisma } from '@prisma/client';

@Injectable()
export class InventoryStoresService {
  private readonly logger = new Logger(InventoryStoresService.name);

  constructor(private prisma: PrismaService) {}

  // Ported from storage.ts: getAllInventoryStores
  async findAll(userId: string): Promise<InventoryStore[]> {
    try {
      return this.prisma.inventoryStore.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory stores: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: createInventoryStore
  async create(data: Prisma.InventoryStoreCreateInput, userId: string): Promise<InventoryStore> {
    try {
      const { user, ...dataWithoutUser } = data as any;
      const store = await this.prisma.inventoryStore.create({
        data: {
          ...dataWithoutUser,
          user: { connect: { id: userId } }, // Use relation syntax as Prisma requires
        },
      });
      this.logger.log(`Created inventory store: ${store.id}`);
      return store;
    } catch (error) {
      this.logger.error(`Error creating inventory store: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: deleteInventoryStore
  async delete(id: string, userId: string): Promise<void> {
    try {
      // First verify the store belongs to the user
      const existing = await this.prisma.inventoryStore.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new NotFoundException(`Inventory store with ID ${id} not found`);
      }

      await this.prisma.inventoryStore.delete({
        where: { id },
      });
      this.logger.log(`Deleted inventory store: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory store with ID ${id} not found`);
      }
      this.logger.error(`Error deleting inventory store: ${error.message}`, error.stack);
      throw error;
    }
  }
}
