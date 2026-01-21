import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TeamMemberTypesService } from './team-member-types.service';

@Module({
  imports: [PrismaModule],
  providers: [TeamMemberTypesService],
  exports: [TeamMemberTypesService],
})
export class TeamMemberTypesModule {}
