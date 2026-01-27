import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryCategoriesService } from './inventory-categories.service';
import { InventoryModule } from '../../inventory/inventory/inventory.module';

@Module({
  imports: [PrismaModule, forwardRef(() => InventoryModule)],
  providers: [InventoryCategoriesService],
  exports: [InventoryCategoriesService],
})
export class InventoryCategoriesModule {}
