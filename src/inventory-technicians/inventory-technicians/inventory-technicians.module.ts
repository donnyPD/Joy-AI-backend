import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryTechniciansService } from './inventory-technicians.service';

@Module({
  imports: [PrismaModule],
  providers: [InventoryTechniciansService],
  exports: [InventoryTechniciansService],
})
export class InventoryTechniciansModule {}
