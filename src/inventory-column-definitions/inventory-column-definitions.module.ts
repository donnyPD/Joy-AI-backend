import { Module } from '@nestjs/common';
import { InventoryColumnDefinitionsService } from './inventory-column-definitions/inventory-column-definitions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InventoryColumnDefinitionsService],
  exports: [InventoryColumnDefinitionsService],
})
export class InventoryColumnDefinitionsModule {}
