import { Module } from '@nestjs/common';
import { InventoryFormSubmissionsService } from './inventory-form-submissions.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InventoryFormSubmissionsService],
  exports: [InventoryFormSubmissionsService],
})
export class InventoryFormSubmissionsModule {}
