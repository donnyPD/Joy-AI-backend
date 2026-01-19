import { Module } from '@nestjs/common';
import { ClientsService } from './clients/clients.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobberModule } from '../jobber/jobber.module';
import { TagsModule } from '../tags/tags.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, JobberModule, TagsModule, AuthModule],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
