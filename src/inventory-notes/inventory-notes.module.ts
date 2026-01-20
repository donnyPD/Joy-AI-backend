import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryNotesService } from './inventory-notes/inventory-notes.service';

@Module({
  imports: [PrismaModule],
  providers: [InventoryNotesService],
  exports: [InventoryNotesService],
})
export class InventoryNotesModule {}
