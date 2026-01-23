import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices/invoices.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobberModule } from '../jobber/jobber.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, JobberModule, AuthModule],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
