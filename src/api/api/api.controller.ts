import { Controller, Get } from '@nestjs/common';
import { ClientsService } from '../../clients/clients/clients.service';

@Controller('api')
export class ApiController {
  constructor(private clientsService: ClientsService) {}

  @Get('status')
  getStatus() {
    return {
      status: 'running',
      connected: true,
      webhooksRegistered: true,
      message: 'Backend is running and ready to receive webhooks',
    };
  }

  @Get('clients')
  async getClients() {
    const clients = await this.clientsService.findAll();
    return {
      success: true,
      count: clients.length,
      clients,
    };
  }

  @Get('sync-status')
  async getSyncStatus() {
    const totalClients = await this.clientsService.count();
    return {
      success: true,
      totalClients,
      status: 'active',
      message: 'Data sync is active',
    };
  }
}
