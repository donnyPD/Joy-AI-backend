import { Controller, Get, Post, Patch, Delete, Put, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientsService } from '../../clients/clients/clients.service';
import { TeamMembersService } from '../../team-members/team-members/team-members.service';
import { KpiEntriesService } from '../../kpi-entries/kpi-entries/kpi-entries.service';
import { InventoryNotesService } from '../../inventory-notes/inventory-notes/inventory-notes.service';
import { InventoryPurchasesService } from '../../inventory-purchases/inventory-purchases/inventory-purchases.service';

@Controller()
export class ApiController {
  constructor(
    private clientsService: ClientsService,
    private teamMembersService: TeamMembersService,
    private kpiEntriesService: KpiEntriesService,
    private inventoryNotesService: InventoryNotesService,
    private inventoryPurchasesService: InventoryPurchasesService,
  ) {}

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

  @Get('team-members')
  async getTeamMembers() {
    try {
      const members = await this.teamMembersService.findAll();
      return members;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }

  @Get('team-members/:id')
  async getTeamMember(@Param('id') id: string) {
    try {
      const member = await this.teamMembersService.findOne(id);
      if (!member) {
        return { error: 'Team member not found' };
      }
      return member;
    } catch (error) {
      console.error('Error fetching team member:', error);
      throw error;
    }
  }

  @Post('team-members')
  async createTeamMember(@Body() data: any) {
    try {
      const member = await this.teamMembersService.create(data);
      return member;
    } catch (error) {
      console.error('Error creating team member:', error);
      throw error;
    }
  }

  @Patch('team-members/:id')
  async updateTeamMember(@Param('id') id: string, @Body() data: any) {
    try {
      const member = await this.teamMembersService.update(id, data);
      return member;
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  }

  @Delete('team-members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTeamMember(@Param('id') id: string) {
    try {
      await this.teamMembersService.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }
  }

  // KPI Entries endpoints
  @Get('kpi-entries/:teamMemberId')
  async getKpiEntries(@Param('teamMemberId') teamMemberId: string) {
    try {
      const entries = await this.kpiEntriesService.findAllByTeamMember(teamMemberId);
      return entries;
    } catch (error) {
      console.error('Error fetching KPI entries:', error);
      throw error;
    }
  }

  @Post('kpi-entries')
  async createKpiEntry(@Body() data: any) {
    try {
      const entry = await this.kpiEntriesService.create(data);
      return entry;
    } catch (error) {
      console.error('Error creating KPI entry:', error);
      throw error;
    }
  }

  @Put('kpi-entries/:id')
  async updateKpiEntry(@Param('id') id: string, @Body() data: any) {
    try {
      const entry = await this.kpiEntriesService.update(id, data);
      return entry;
    } catch (error) {
      console.error('Error updating KPI entry:', error);
      throw error;
    }
  }

  @Delete('kpi-entries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteKpiEntry(@Param('id') id: string) {
    try {
      await this.kpiEntriesService.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting KPI entry:', error);
      throw error;
    }
  }

  // Inventory Notes endpoints
  @Get('team-members/:id/notes')
  async getTeamMemberNotes(@Param('id') id: string) {
    try {
      const notes = await this.inventoryNotesService.findAllByTeamMember(id);
      return notes;
    } catch (error) {
      console.error('Error fetching team member notes:', error);
      throw error;
    }
  }

  @Post('inventory/notes')
  async createInventoryNote(@Body() data: any) {
    try {
      const note = await this.inventoryNotesService.create(data);
      return note;
    } catch (error) {
      console.error('Error creating inventory note:', error);
      throw error;
    }
  }

  // Inventory Purchases endpoints
  @Get('team-members/:id/inventory-purchases')
  async getTeamMemberInventoryPurchases(
    @Param('id') id: string,
    @Query('year') year?: string,
  ) {
    try {
      const yearNum = year ? parseInt(year, 10) : undefined;
      const purchases = await this.inventoryPurchasesService.findAllByTeamMember(
        id,
        yearNum,
      );
      return purchases;
    } catch (error) {
      console.error('Error fetching team member inventory purchases:', error);
      throw error;
    }
  }
}