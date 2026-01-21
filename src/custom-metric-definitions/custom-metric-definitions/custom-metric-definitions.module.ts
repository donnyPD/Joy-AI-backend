import { Module } from '@nestjs/common';
import { CustomMetricDefinitionsService } from './custom-metric-definitions.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CustomMetricDefinitionsService],
  exports: [CustomMetricDefinitionsService],
})
export class CustomMetricDefinitionsModule {}
