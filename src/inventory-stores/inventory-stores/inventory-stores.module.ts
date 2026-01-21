import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryStoresService } from './inventory-stores.service';

@Module({
  imports: [PrismaModule],
  providers: [InventoryStoresService],
  exports: [InventoryStoresService],
})
export class InventoryStoresModule {}
