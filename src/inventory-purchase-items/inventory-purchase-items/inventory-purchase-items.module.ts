import { Module } from '@nestjs/common';
import { InventoryPurchaseItemsService } from './inventory-purchase-items.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InventoryPurchaseItemsService],
  exports: [InventoryPurchaseItemsService],
})
export class InventoryPurchaseItemsModule {}
