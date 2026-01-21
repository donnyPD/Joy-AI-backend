import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TeamMemberStatusesService } from './team-member-statuses.service';

@Module({
  imports: [PrismaModule],
  providers: [TeamMemberStatusesService],
  exports: [TeamMemberStatusesService],
})
export class TeamMemberStatusesModule {}
