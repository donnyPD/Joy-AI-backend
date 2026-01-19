import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [ClientsModule],
  controllers: [ApiController],
})
export class ApiModule {}
