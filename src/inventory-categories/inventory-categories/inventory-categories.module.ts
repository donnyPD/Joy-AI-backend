import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryCategoriesService } from './inventory-categories.service';

@Module({
  imports: [PrismaModule],
  providers: [InventoryCategoriesService],
  exports: [InventoryCategoriesService],
})
export class InventoryCategoriesModule {}
