import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JobberModule } from '../jobber/jobber.module';
import { TagsModule } from '../tags/tags.module';
import { AuthModule } from '../auth/auth.module';
import { JobsService } from './jobs/jobs.service';

@Module({
  imports: [PrismaModule, JobberModule, TagsModule, AuthModule],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
