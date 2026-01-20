import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { ClientsModule } from '../clients/clients.module';
import { TeamMembersModule } from '../team-members/team-members.module';
import { KpiEntriesModule } from '../kpi-entries/kpi-entries.module';
import { InventoryNotesModule } from '../inventory-notes/inventory-notes.module';
import { InventoryPurchasesModule } from '../inventory-purchases/inventory-purchases.module';


@Module({
  imports: [
    ClientsModule, 
    TeamMembersModule,
    KpiEntriesModule, 
    InventoryNotesModule, 
    InventoryPurchasesModule
  ],
  controllers: [ApiController],
})
export class ApiModule {}
