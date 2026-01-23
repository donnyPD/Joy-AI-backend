import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { ClientsModule } from '../clients/clients.module';
import { TeamMembersModule } from '../team-members/team-members.module';
import { KpiEntriesModule } from '../kpi-entries/kpi-entries.module';
import { InventoryNotesModule } from '../inventory-notes/inventory-notes.module';
import { InventoryPurchasesModule } from '../inventory-purchases/inventory-purchases.module';
import { InventoryModule } from '../inventory/inventory/inventory.module';
import { InventoryCategoriesModule } from '../inventory-categories/inventory-categories/inventory-categories.module';
import { InventoryTechniciansModule } from '../inventory-technicians/inventory-technicians/inventory-technicians.module';
import { InventorySnapshotsModule } from '../inventory-snapshots/inventory-snapshots/inventory-snapshots.module';
import { InventoryStoresModule } from '../inventory-stores/inventory-stores/inventory-stores.module';
import { InventoryPurchaseItemsModule } from '../inventory-purchase-items/inventory-purchase-items/inventory-purchase-items.module';
import { InventoryFormSubmissionsModule } from '../inventory-form-submissions/inventory-form-submissions/inventory-form-submissions.module';
import { InventoryFormConfigModule } from '../inventory-form-config/inventory-form-config.module';
import { InventoryColumnDefinitionsModule } from '../inventory-column-definitions/inventory-column-definitions.module';
import { CustomMetricDefinitionsModule } from '../custom-metric-definitions/custom-metric-definitions/custom-metric-definitions.module';
import { TeamMemberTypesModule } from '../team-member-types/team-member-types/team-member-types.module';
import { TeamMemberStatusesModule } from '../team-member-statuses/team-member-statuses/team-member-statuses.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { QuotesModule } from '../quotes/quotes.module';
import { JobsModule } from '../jobs/jobs.module';
import { VisitsModule } from '../visits/visits.module';
import { TimesheetsModule } from '../timesheets/timesheets.module';
import { NotificationTemplateModule } from '../notification-templates/notification-templates/notification-template.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ClientsModule, 
    TeamMembersModule,
    KpiEntriesModule, 
    InventoryNotesModule, 
    InventoryPurchasesModule,
    InventoryModule,
    InventoryCategoriesModule,
    InventoryTechniciansModule,
    InventorySnapshotsModule,
    InventoryStoresModule,
    InventoryPurchaseItemsModule,
    InventoryFormSubmissionsModule,
    InventoryFormConfigModule,
    InventoryColumnDefinitionsModule,
    CustomMetricDefinitionsModule,
    TeamMemberTypesModule,
    TeamMemberStatusesModule,
    InvoicesModule,
    QuotesModule,
    JobsModule,
    VisitsModule,
    TimesheetsModule,
    NotificationTemplateModule,
    AuthModule,
    PrismaModule,
  ],
  controllers: [ApiController],
})
export class ApiModule {}
