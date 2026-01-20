import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryPurchasesService } from './inventory-purchases/inventory-purchases.service';

@Module({
  imports: [PrismaModule],
  providers: [InventoryPurchasesService],
  exports: [InventoryPurchasesService],
})
export class InventoryPurchasesModule {}
