import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryStore, Prisma } from '@prisma/client';

@Injectable()
export class InventoryStoresService {
  private readonly logger = new Logger(InventoryStoresService.name);

  constructor(private prisma: PrismaService) {}

  // Ported from storage.ts: getAllInventoryStores
  async findAll(): Promise<InventoryStore[]> {
    try {
      return this.prisma.inventoryStore.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching inventory stores: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: createInventoryStore
  async create(data: Prisma.InventoryStoreCreateInput): Promise<InventoryStore> {
    try {
      const store = await this.prisma.inventoryStore.create({
        data,
      });
      this.logger.log(`Created inventory store: ${store.id}`);
      return store;
    } catch (error) {
      this.logger.error(`Error creating inventory store: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Ported from storage.ts: deleteInventoryStore
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.inventoryStore.delete({
        where: { id },
      });
      this.logger.log(`Deleted inventory store: ${id}`);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory store with ID ${id} not found`);
      }
      this.logger.error(`Error deleting inventory store: ${error.message}`, error.stack);
      throw error;
    }
  }
}
