import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventorySnapshotsService } from './inventory-snapshots.service';

@Module({
  imports: [PrismaModule],
  providers: [InventorySnapshotsService],
  exports: [InventorySnapshotsService],
})
export class InventorySnapshotsModule {}
