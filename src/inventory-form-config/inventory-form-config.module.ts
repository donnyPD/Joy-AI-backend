import { Module } from '@nestjs/common';
import { InventoryFormConfigService } from './inventory-form-config/inventory-form-config.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InventoryFormConfigService],
  exports: [InventoryFormConfigService],
})
export class InventoryFormConfigModule {}
