import { Controller, Get, Post, Patch, Delete, Put, Body, Param, Query, HttpCode, HttpStatus, Request, UseGuards, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClientsService } from '../../clients/clients/clients.service';
import { TeamMembersService } from '../../team-members/team-members/team-members.service';
import { KpiEntriesService } from '../../kpi-entries/kpi-entries/kpi-entries.service';
import { InventoryNotesService } from '../../inventory-notes/inventory-notes/inventory-notes.service';
import { InventoryPurchasesService } from '../../inventory-purchases/inventory-purchases/inventory-purchases.service';
import { InventoryService } from '../../inventory/inventory/inventory.service';
import { InventoryCategoriesService } from '../../inventory-categories/inventory-categories/inventory-categories.service';
import { InventoryTechniciansService } from '../../inventory-technicians/inventory-technicians/inventory-technicians.service';
import { InventorySnapshotsService } from '../../inventory-snapshots/inventory-snapshots/inventory-snapshots.service';
import { InventoryStoresService } from '../../inventory-stores/inventory-stores/inventory-stores.service';
import { InventoryPurchaseItemsService } from '../../inventory-purchase-items/inventory-purchase-items/inventory-purchase-items.service';
import { InventoryFormSubmissionsService } from '../../inventory-form-submissions/inventory-form-submissions/inventory-form-submissions.service';
import { InventoryFormConfigService } from '../../inventory-form-config/inventory-form-config/inventory-form-config.service';
import { InventoryColumnDefinitionsService } from '../../inventory-column-definitions/inventory-column-definitions/inventory-column-definitions.service';
import { CustomMetricDefinitionsService } from '../../custom-metric-definitions/custom-metric-definitions/custom-metric-definitions.service';
import { TeamMemberTypesService } from '../../team-member-types/team-member-types/team-member-types.service';
import { TeamMemberStatusesService } from '../../team-member-statuses/team-member-statuses/team-member-statuses.service';
import { NotificationTemplateService } from '../../notification-templates/notification-templates/notification-template.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller()
export class ApiController {
  constructor(
    private clientsService: ClientsService,
    private teamMembersService: TeamMembersService,
    private kpiEntriesService: KpiEntriesService,
    private inventoryNotesService: InventoryNotesService,
    private inventoryPurchasesService: InventoryPurchasesService,
    private inventoryService: InventoryService,
    private inventoryCategoriesService: InventoryCategoriesService,
    private inventoryTechniciansService: InventoryTechniciansService,
    private inventorySnapshotsService: InventorySnapshotsService,
    private inventoryStoresService: InventoryStoresService,
    private inventoryPurchaseItemsService: InventoryPurchaseItemsService,
    private inventoryFormSubmissionsService: InventoryFormSubmissionsService,
    private inventoryFormConfigService: InventoryFormConfigService,
    private inventoryColumnDefinitionsService: InventoryColumnDefinitionsService,
    private customMetricDefinitionsService: CustomMetricDefinitionsService,
    private teamMemberTypesService: TeamMemberTypesService,
    private teamMemberStatusesService: TeamMemberStatusesService,
    private notificationTemplateService: NotificationTemplateService,
    private prisma: PrismaService,
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

  @UseGuards(JwtAuthGuard)
  @Get('team-members')
  async getTeamMembers(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const members = await this.teamMembersService.findAll(userId);
      return members;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('team-members/:id')
  async getTeamMember(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const member = await this.teamMembersService.findOne(id, userId);
      if (!member) {
        return { error: 'Team member not found' };
      }
      return member;
    } catch (error) {
      console.error('Error fetching team member:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('team-members')
  async createTeamMember(@Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const member = await this.teamMembersService.create(data, userId);
      return member;
    } catch (error) {
      console.error('Error creating team member:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('team-members/:id')
  async updateTeamMember(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const member = await this.teamMembersService.update(id, data, userId);
      return member;
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('team-members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTeamMember(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      await this.teamMembersService.delete(id, userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }
  }

  // KPI Entries endpoints
  @UseGuards(JwtAuthGuard)
  @Get('kpi-entries/:teamMemberId')
  async getKpiEntries(@Param('teamMemberId') teamMemberId: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      console.log(`[getKpiEntries] User ID: ${userId}, Team Member ID: ${teamMemberId}`);
      const entries = await this.kpiEntriesService.findAllByTeamMember(teamMemberId, userId);
      console.log(`[getKpiEntries] Found ${entries.length} entries for user ${userId}`);
      return entries;
    } catch (error) {
      console.error('Error fetching KPI entries:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('kpi-entries')
  async createKpiEntry(@Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const entry = await this.kpiEntriesService.create(data, userId);
      return entry;
    } catch (error) {
      console.error('Error creating KPI entry:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('kpi-entries/:id')
  async updateKpiEntry(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const entry = await this.kpiEntriesService.update(id, data, userId);
      return entry;
    } catch (error) {
      console.error('Error updating KPI entry:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('kpi-entries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteKpiEntry(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      await this.kpiEntriesService.delete(id, userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting KPI entry:', error);
      throw error;
    }
  }

  // Team Metrics Summary endpoint
  @UseGuards(JwtAuthGuard)
  @Get('team-metrics-summary')
  async getTeamMetricsSummary(@Request() req: any, @Query('month') month?: string) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      // Get all team members for this user
      const allTeamMembers = await this.teamMembersService.findAll(userId);

      // Get all KPI entries for this user
      const allKpiEntries = await this.kpiEntriesService.findAll(userId);

      // Filter entries by month if provided
      let filteredEntries = allKpiEntries;
      if (month && typeof month === 'string') {
        const [year, monthPart] = month.split('-');
        const yearNum = Number(year);

        if (monthPart === 'all') {
          // Filter by year only when "all months" is selected
          filteredEntries = allKpiEntries.filter((entry) => {
            const entryDate = new Date(entry.date);
            return entryDate.getFullYear() === yearNum;
          });
        } else {
          const monthNum = Number(monthPart);
          filteredEntries = allKpiEntries.filter((entry) => {
            const entryDate = new Date(entry.date);
            return (
              entryDate.getFullYear() === yearNum &&
              entryDate.getMonth() + 1 === monthNum
            );
          });
        }
      }

      // Define the 7 tracked metrics
      const metricTypes = [
        'lastMinuteCallOffs',
        'arrivingLate',
        'excusedTimeOffs',
        'complaints',
        'npsMonthly',
        'googleReviewsObtained',
        'damages',
      ];

      // Separate active and dismissed team members
      const activeMembers = allTeamMembers.filter(
        (m) => m.status !== 'Dismissed',
      );
      const dismissedMembers = allTeamMembers.filter(
        (m) => m.status === 'Dismissed',
      );

      // Build summary for each member
      const buildMemberSummary = (member: typeof allTeamMembers[0]) => {
        const memberEntries = filteredEntries.filter(
          (e) => e.teamMemberId === member.id,
        );

        const metrics: Record<
          string,
          { count: number; entries: typeof memberEntries }
        > = {};
        for (const metricType of metricTypes) {
          const typeEntries = memberEntries.filter(
            (e) => e.kpiType === metricType,
          );
          metrics[metricType] = {
            count: typeEntries.length,
            entries: typeEntries,
          };
        }

        return {
          id: member.id,
          name: member.name,
          photo: member.photo,
          status: member.status,
          metrics,
        };
      };

      const activeSummaries = activeMembers.map(buildMemberSummary);
      const dismissedSummaries = dismissedMembers.map(buildMemberSummary);

      return {
        active: activeSummaries,
        dismissed: dismissedSummaries,
        metricTypes,
      };
    } catch (error) {
      console.error('Error fetching team metrics summary:', error);
      throw error;
    }
  }

  // Custom Metric Definitions endpoints
  @UseGuards(JwtAuthGuard)
  @Get('custom-metric-definitions')
  async getCustomMetricDefinitions(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const metrics = await this.customMetricDefinitionsService.findAll(userId);
      return metrics;
    } catch (error) {
      console.error('Error fetching custom metric definitions:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('custom-metric-definitions/:id')
  async getCustomMetricDefinition(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const metric = await this.customMetricDefinitionsService.findOne(id, userId);
      if (!metric) {
        return { message: 'Custom metric definition not found' };
      }
      return metric;
    } catch (error) {
      console.error('Error fetching custom metric definition:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('custom-metric-definitions')
  async createCustomMetricDefinition(@Body() data: any, @Request() req: any) {
    try {
      // Validation
      if (!data.name || !data.name.trim()) {
        return { message: 'Metric name is required' };
      }

      if (!data.fields || !Array.isArray(data.fields) || data.fields.length === 0) {
        return { message: 'At least one field is required' };
      }

      // Validate each field
      for (const field of data.fields) {
        if (!field.id || !field.name || !field.name.trim()) {
          return { message: 'All fields must have an id and name' };
        }
        if (!['date', 'text', 'upload', 'dollarValue', 'number', 'image'].includes(field.type)) {
          return { message: `Invalid field type: ${field.type}` };
        }
        if (typeof field.required !== 'boolean') {
          return { message: 'Field required must be a boolean' };
        }
      }

      // Validate threshold if provided
      let thresholdValue: number | null = null;
      if (data.threshold !== undefined && data.threshold !== null && data.threshold !== '') {
        const thresholdNum = Number(data.threshold);
        if (isNaN(thresholdNum) || thresholdNum < 0) {
          return { message: 'Threshold must be a positive number' };
        }
        thresholdValue = Math.floor(thresholdNum);
      }

      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }

      const metric = await this.customMetricDefinitionsService.create({
        name: data.name.trim(),
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
        fields: data.fields,
        isActive: data.isActive !== undefined ? data.isActive : true,
        threshold: thresholdValue,
      } as any, userId);

      return metric;
    } catch (error) {
      console.error('Error creating custom metric definition:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('custom-metric-definitions/:id')
  async updateCustomMetricDefinition(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      // Check if metric exists and belongs to user
      const existing = await this.customMetricDefinitionsService.findOne(id, userId);
      if (!existing) {
        return { message: 'Custom metric definition not found' };
      }

      // Validation for updated fields
      const updateData: any = {};

      if (data.name !== undefined) {
        if (!data.name || !data.name.trim()) {
          return { message: 'Metric name cannot be empty' };
        }
        updateData.name = data.name.trim();
      }

      if (data.description !== undefined) {
        updateData.description = data.description || null;
      }

      if (data.icon !== undefined) {
        updateData.icon = data.icon || null;
      }

      if (data.color !== undefined) {
        updateData.color = data.color || null;
      }

      if (data.fields !== undefined) {
        if (!Array.isArray(data.fields) || data.fields.length === 0) {
          return { message: 'At least one field is required' };
        }

        // Validate each field
        for (const field of data.fields) {
          if (!field.id || !field.name || !field.name.trim()) {
            return { message: 'All fields must have an id and name' };
          }
          if (!['date', 'text', 'upload', 'dollarValue', 'number', 'image'].includes(field.type)) {
            return { message: `Invalid field type: ${field.type}` };
          }
          if (typeof field.required !== 'boolean') {
            return { message: 'Field required must be a boolean' };
          }
        }
        updateData.fields = data.fields;
      }

      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      if (data.threshold !== undefined) {
        if (data.threshold === null || data.threshold === '') {
          updateData.threshold = null;
        } else {
          const thresholdNum = Number(data.threshold);
          if (isNaN(thresholdNum) || thresholdNum < 0) {
            return { message: 'Threshold must be a positive number' };
          }
          updateData.threshold = Math.floor(thresholdNum);
        }
      }

      const metric = await this.customMetricDefinitionsService.update(id, updateData, userId);
      return metric;
    } catch (error) {
      console.error('Error updating custom metric definition:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('custom-metric-definitions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCustomMetricDefinition(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const metric = await this.customMetricDefinitionsService.findOne(id, userId);
      if (!metric) {
        return { message: 'Custom metric definition not found' };
      }

      await this.customMetricDefinitionsService.delete(id, userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting custom metric definition:', error);
      throw error;
    }
  }

  // Inventory Notes endpoints
  @UseGuards(JwtAuthGuard)
  @Get('team-members/:id/notes')
  async getTeamMemberNotes(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const notes = await this.inventoryNotesService.findAllByTeamMember(id, userId);
      return notes;
    } catch (error) {
      console.error('Error fetching team member notes:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/notes')
  async createInventoryNote(@Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const { noteText, noteType, teamMemberId } = data;

      if (!noteText || typeof noteText !== 'string' || noteText.trim() === '') {
        return { error: 'Note text is required' };
      }

      // Validate noteType - must be explicitly 'technician' or defaults to 'general'
      const validNoteType = noteType === 'technician' ? 'technician' : 'general';

      // Validate technician notes require a teamMemberId
      if (validNoteType === 'technician' && !teamMemberId) {
        return { error: 'Technician notes require a team member to be selected' };
      }

      // Reject teamMemberId for general notes (enforce consistency)
      if (validNoteType === 'general' && teamMemberId) {
        return { error: 'General notes cannot be associated with a technician' };
      }

      // Generate NY timestamp - matching Replit format
      const now = new Date();
      const nyFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const nyTimestamp = nyFormatter.format(now);

      const note = await this.inventoryNotesService.create({
        noteText: noteText.trim(),
        nyTimestamp,
        noteType: validNoteType,
        ...(validNoteType === 'technician' && teamMemberId
          ? { teamMember: { connect: { id: teamMemberId } } }
          : {}),
      }, userId);

      return note;
    } catch (error) {
      console.error('Error creating inventory note:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory/notes/:id')
  async updateInventoryNote(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const { noteText } = data;
      if (!noteText || typeof noteText !== 'string' || noteText.trim() === '') {
        return { error: 'Note text is required' };
      }
      const note = await this.inventoryNotesService.update(id, { noteText: noteText.trim() }, userId);
      return note;
    } catch (error) {
      console.error('Error updating inventory note:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory/notes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryNote(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      await this.inventoryNotesService.delete(id, userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory note:', error);
      throw error;
    }
  }

  // Inventory Purchases endpoints
  @UseGuards(JwtAuthGuard)
  @Get('team-members/:id/inventory-purchases')
  async getTeamMemberInventoryPurchases(
    @Param('id') id: string,
    @Request() req: any,
    @Query('year') year?: string,
  ) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }

      // Get team member to get their name
      const teamMember = await this.teamMembersService.findOne(id, userId);
      if (!teamMember) {
        console.log(`Team member not found for ID: ${id}`);
        return [];
      }

      console.log(`Looking for technician with name: ${teamMember.name}`);

      // Find inventory technician by matching name
      const technician = await this.inventoryTechniciansService.findByName(teamMember.name, userId);
      if (!technician) {
        // If no technician found, return empty array
        console.log(`No technician found with name: ${teamMember.name}`);
        return [];
      }

      console.log(`Found technician with ID: ${technician.id}, techName: ${technician.techName}`);

      const yearNum = year ? parseInt(year, 10) : undefined;
      console.log(`Fetching purchases for technician ${technician.id}, year: ${yearNum || 'all'}`);
      
      const purchases = await this.inventoryPurchasesService.findAllByTeamMember(
        technician.id,
        userId,
        yearNum,
      );
      
      console.log(`Found ${purchases.length} purchases for technician ${technician.id}`);
      return purchases;
    } catch (error) {
      console.error('Error fetching team member inventory purchases:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory/purchases/:id')
  async updateInventoryPurchase(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const purchase = await this.inventoryPurchaseItemsService.update(id, data, userId);
      return purchase;
    } catch (error) {
      console.error('Error updating inventory purchase:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory/purchases/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryPurchase(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      await this.inventoryPurchaseItemsService.delete(id, userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory purchase:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory/purchases/order/:orderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryPurchasesByOrderId(@Param('orderId') orderId: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      await this.inventoryPurchaseItemsService.deleteByOrderId(orderId, userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory purchases by orderId:', error);
      throw error;
    }
  }

  // Inventory Categories endpoints
  @UseGuards(JwtAuthGuard)
  @Get('inventory/categories')
  async getInventoryCategories(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const categories = await this.inventoryCategoriesService.findAll(userId);
      return categories;
    } catch (error) {
      console.error('Error fetching inventory categories:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/categories')
  async createInventoryCategory(@Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const { name } = data;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return { error: 'Category name is required' };
      }
      const category = await this.inventoryCategoriesService.create({
        name: name.trim(),
        isVisibleOnForm: data.isVisibleOnForm !== undefined ? data.isVisibleOnForm : true,
      }, userId);
      return category;
    } catch (error) {
      console.error('Error creating inventory category:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory/categories/:id')
  async updateInventoryCategory(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const category = await this.inventoryCategoriesService.update(id, data, userId);
      return category;
    } catch (error) {
      console.error('Error updating inventory category:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory/categories/:id/visibility')
  async updateInventoryCategoryVisibility(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const { isVisibleOnForm } = data;
      if (typeof isVisibleOnForm !== 'boolean') {
        return { error: 'isVisibleOnForm must be a boolean' };
      }
      const category = await this.inventoryCategoriesService.update(id, { isVisibleOnForm }, userId);
      return category;
    } catch (error) {
      console.error('Error updating inventory category visibility:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory/categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryCategory(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      await this.inventoryCategoriesService.delete(id, userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory category:', error);
      throw error;
    }
  }

  // Inventory endpoints - NOTE: Must come before /inventory/:id
  @UseGuards(JwtAuthGuard)
  @Get('inventory')
  async getInventory(@Request() req: any, @Query('type') type?: string, @Query('categoryId') categoryId?: string) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      let items;
      if (categoryId) {
        items = await this.inventoryService.findByCategory(categoryId, userId);
      } else if (type) {
        items = await this.inventoryService.findByType(type, userId);
      } else {
        items = await this.inventoryService.findAll(userId);
      }
      return items;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory')
  async createInventoryItem(@Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const {
        name,
        type,
        categoryId,
        totalRequested,
        totalInventory,
        pricePerUnit,
        threshold,
        idealTotalInventory,
      } = data;

      if (!name || !type || !categoryId) {
        return { error: 'Name, type, and categoryId are required' };
      }

      // Verify category exists
      const category = await this.inventoryCategoriesService.findOne(categoryId, userId);
      if (!category) {
        return { error: 'Invalid category' };
      }

      // Get the next row number for this category - ported exact logic
      const existingItems = await this.inventoryService.findByCategory(categoryId, userId);
      const maxRowNumber = existingItems.reduce((max, item) => {
        return Math.max(max, item.rowNumber || 0);
      }, 0);

      // Create the inventory item - ported exact logic
      const newItem = await this.inventoryService.create({
        name,
        type,
        category: { connect: { id: categoryId } },
        totalRequested: totalRequested || 0,
        totalInventory: totalInventory || 0,
        pricePerUnit: pricePerUnit || '',
        threshold: threshold || 3,
        idealTotalInventory: idealTotalInventory !== undefined ? idealTotalInventory : 0,
        rowNumber: maxRowNumber + 1,
      }, userId);

      return newItem;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  // Inventory Notes endpoints (for inventory page, not team member specific)
  // NOTE: Must come before /inventory/:id to avoid route conflicts
  @UseGuards(JwtAuthGuard)
  @Get('inventory/notes')
  async getInventoryNotes(@Request() req: any, @Query('month') month?: string, @Query('year') year?: string) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return [];
      }

      // Get all notes for the user and filter by month/year - ported exact logic
      const allNotes = await this.inventoryNotesService.findAll(userId);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[monthNum - 1];

      const filteredNotes = allNotes.filter((note) => {
        const dateStr = note.nyTimestamp;
        return dateStr.includes(monthName) && dateStr.includes(yearNum.toString());
      });

      return filteredNotes || [];
    } catch (error) {
      console.error('Error fetching inventory notes:', error);
      return [];
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory/notes/available-months')
  async getInventoryNotesAvailableMonths(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const months = await this.inventoryNotesService.getAvailableMonths(userId);
      return months;
    } catch (error) {
      console.error('Error fetching available note months:', error);
      throw error;
    }
  }

  // Inventory Snapshots endpoints
  // NOTE: Must come before /inventory/:id to avoid route conflicts
  @UseGuards(JwtAuthGuard)
  @Get('inventory/snapshot')
  async getInventorySnapshot(@Request() req: any, @Query('month') month?: string, @Query('year') year?: string) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return { error: 'Month and year are required' };
      }

      const snapshot = await this.inventorySnapshotsService.findByMonthYear(monthNum, yearNum, userId);
      return snapshot || null;
    } catch (error) {
      console.error('Error fetching inventory snapshot:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory/snapshot-months')
  async getSnapshotMonths(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const months = await this.inventorySnapshotsService.getAvailableMonths(userId);
      return months;
    } catch (error) {
      console.error('Error fetching snapshot months:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/auto-snapshot')
  async autoCreateSnapshot(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      // Ported exact logic from routes.ts
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Calculate previous month
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = currentYear - 1;
      }

      // Check if snapshot exists for previous month
      const existingSnapshot = await this.inventorySnapshotsService.findByMonthYear(prevMonth, prevYear, userId);

      if (!existingSnapshot) {
        // Create snapshot for previous month using current inventory data
        const inventoryItems = await this.inventoryService.findAll(userId);
        const snapshotData = inventoryItems.map((item) => ({
          name: item.name,
          type: item.type,
          totalRequested: item.totalRequested || 0,
          totalInventory: item.totalInventory || 0,
          pricePerUnit: item.pricePerUnit,
          threshold: item.threshold || 0,
          rowNumber: item.rowNumber,
        }));

        const snapshot = await this.inventorySnapshotsService.create(prevMonth, prevYear, snapshotData, userId);
        return { created: true, snapshot };
      } else {
        return { created: false, snapshot: existingSnapshot };
      }
    } catch (error) {
      console.error('Error in auto-snapshot:', error);
      throw error;
    }
  }

  // Inventory Stores endpoints
  // NOTE: Must come before /inventory/:id to avoid route conflicts
  @UseGuards(JwtAuthGuard)
  @Get('inventory/stores')
  async getInventoryStores(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const stores = await this.inventoryStoresService.findAll(userId);
      return stores;
    } catch (error) {
      console.error('Error fetching inventory stores:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/stores')
  async createInventoryStore(@Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const { name } = data;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return { error: 'Store name is required' };
      }
      const store = await this.inventoryStoresService.create({
        name: name.trim(),
      }, userId);
      return store;
    } catch (error) {
      console.error('Error creating inventory store:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory/stores/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryStore(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      await this.inventoryStoresService.delete(id, userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory store:', error);
      throw error;
    }
  }

  // Inventory Purchases endpoints (different from technician purchases)
  // NOTE: Must come before /inventory/:id to avoid route conflicts
  @UseGuards(JwtAuthGuard)
  @Get('inventory/purchases')
  async getInventoryPurchases(@Request() req: any, @Query('month') month?: string, @Query('year') year?: string) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return [];
      }

      const purchases = await this.inventoryPurchaseItemsService.findByMonth(monthNum, yearNum, userId);
      return purchases || [];
    } catch (error) {
      console.error('Error fetching inventory purchases:', error);
      return [];
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory/purchases/available-months')
  async getInventoryPurchasesAvailableMonths(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const months = await this.inventoryPurchaseItemsService.getAvailableMonths(userId);
      return months;
    } catch (error) {
      console.error('Error fetching available purchase months:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory/purchases')
  async createInventoryPurchases(@Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const { purchases, technicianName } = data;
      if (!purchases || !Array.isArray(purchases) || purchases.length === 0) {
        return { error: 'Purchases array is required' };
      }

      // Transform purchases to Prisma format
      const purchaseData = purchases.map((p: any) => ({
        orderId: p.orderId || `LEGACY-${Date.now()}-${Math.random()}`,
        itemName: p.itemName,
        orderedFrom: p.orderedFrom,
        amount: p.amount,
        quantity: p.quantity || 1,
        purchasedAt: p.purchasedAt,
        ...(p.itemId ? { item: { connect: { id: p.itemId } } } : {}),
      }));

      const created = await this.inventoryPurchaseItemsService.createMany(purchaseData, userId);

      // If technician is specified, also create InventoryTechnicianPurchase records
      if (technicianName && technicianName.trim()) {
        try {
          console.log(`Creating technician purchase for: ${technicianName.trim()}`);
          
          // Find or create inventory technician
          let technician = await this.inventoryTechniciansService.findByName(technicianName.trim(), userId);
          if (!technician) {
            console.log(`Technician not found, creating new one: ${technicianName.trim()}`);
            technician = await this.inventoryTechniciansService.create({
              techName: technicianName.trim(),
            }, userId);
            console.log(`Created technician with ID: ${technician.id}`);
          } else {
            console.log(`Found existing technician with ID: ${technician.id}`);
          }

          // Format purchase date (use the first purchase's date or today)
          const purchaseDate = purchases[0]?.purchasedAt || new Date().toISOString().split('T')[0];
          console.log(`Purchase date: ${purchaseDate}`);
          
          // Format items as a readable string
          const itemsList = purchases.map((p: any) => 
            `${p.itemName} (Qty: ${p.quantity}, Amount: $${p.amount})`
          ).join(', ');
          
          // Create parsed items structure
          const itemsParsed = purchases.map((p: any) => ({
            itemName: p.itemName,
            quantity: p.quantity || 1,
            amount: p.amount,
            orderedFrom: p.orderedFrom,
          }));

          console.log(`Creating technician purchase with ${purchases.length} items`);
          
          // Create InventoryTechnicianPurchase record
          const techPurchase = await this.inventoryTechniciansService.createTechnicianPurchase({
            technician: { connect: { id: technician.id } },
            purchaseDate,
            itemsRaw: itemsList,
            itemsParsed,
            isCompleted: false,
          }, userId);

          console.log(`Successfully created technician purchase with ID: ${techPurchase.id}`);

          // Update technician's latest purchase date
          await this.inventoryTechniciansService.update(technician.id, {
            latestPurchaseDate: purchaseDate,
          }, userId);
          
          console.log(`Updated technician latest purchase date to: ${purchaseDate}`);
        } catch (techError) {
          // Log error but don't fail the purchase creation
          console.error('Error creating technician purchase record:', techError);
          console.error('Error stack:', techError.stack);
        }
      } else {
        console.log('No technician name provided, skipping technician purchase creation');
      }

      return created;
    } catch (error) {
      console.error('Error creating inventory purchases:', error);
      throw error;
    }
  }

  // Inventory item by ID - MUST come after all specific routes
  @UseGuards(JwtAuthGuard)
  @Get('inventory/:id')
  async getInventoryItem(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const item = await this.inventoryService.findOne(id, userId);
      if (!item) {
        throw new NotFoundException('Inventory item not found');
      }
      return item;
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('inventory/:id')
  async updateInventoryItem(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const {
        name,
        totalRequested,
        totalInventory,
        pricePerUnit,
        idealTotalInventory,
        toBeOrdered,
        threshold,
        preferredStore,
      } = data;

      const updateData: any = {};
      if (name !== undefined && name.trim()) {
        updateData.name = name.trim();
      }
      if (totalRequested !== undefined) {
        updateData.totalRequested = totalRequested;
      }
      if (totalInventory !== undefined) {
        updateData.totalInventory = totalInventory;
      }
      if (pricePerUnit !== undefined) {
        updateData.pricePerUnit = pricePerUnit;
      }
      if (idealTotalInventory !== undefined) {
        updateData.idealTotalInventory = idealTotalInventory;
      }
      if (toBeOrdered !== undefined) {
        updateData.toBeOrdered = toBeOrdered;
      }
      if (threshold !== undefined) {
        updateData.threshold = threshold;
      }
      if (preferredStore !== undefined) {
        updateData.preferredStore = preferredStore;
      }
      if (data.dynamicFields !== undefined) {
        updateData.dynamicFields = data.dynamicFields;
      }

      const item = await this.inventoryService.update(id, updateData, userId);
      return item;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryItem(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      await this.inventoryService.delete(id, userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  // Inventory Technicians endpoints - NOTE: Must come before /inventory/:id
  @UseGuards(JwtAuthGuard)
  @Get('inventory/technicians')
  async getInventoryTechnicians(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const technicians = await this.inventoryTechniciansService.getLatestTechnicianPurchases(userId);
      return technicians;
    } catch (error) {
      console.error('Error fetching inventory technicians:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory/technicians/:id/purchases')
  async getTechnicianPurchases(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const purchases = await this.inventoryTechniciansService.getTechnicianPurchases(id, userId);
      return purchases;
    } catch (error) {
      console.error('Error fetching technician purchases:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory/technicians-by-month')
  async getTechniciansByMonth(@Request() req: any, @Query('month') month?: string, @Query('year') year?: string, @Query('includeCompleted') includeCompleted?: string) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');
      const includeHidden = includeCompleted === 'true';

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return [];
      }

      const technicians = await this.inventoryTechniciansService.getTechnicianPurchasesByMonth(
        monthNum,
        yearNum,
        userId,
        includeHidden,
      );
      return technicians || [];
    } catch (error) {
      console.error('Error fetching technicians by month:', error);
      return [];
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory/technicians/purchases/:id/complete')
  async completePurchase(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const purchase = await this.inventoryTechniciansService.markPurchaseCompleted(id, userId);
      if (!purchase) {
        return { error: 'Purchase not found' };
      }
      return purchase;
    } catch (error) {
      console.error('Error completing purchase:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory/technicians/purchases/:id/uncomplete')
  async uncompletePurchase(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const purchase = await this.inventoryTechniciansService.markPurchaseUncompleted(id, userId);
      if (!purchase) {
        return { error: 'Purchase not found' };
      }
      return purchase;
    } catch (error) {
      console.error('Error uncompleting purchase:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory/technicians/purchases/:id')
  @Put('inventory/technicians/purchases/:id')
  async updateInventoryTechnicianPurchase(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const purchase = await this.inventoryPurchasesService.update(id, data, userId);
      return purchase;
    } catch (error) {
      console.error('Error updating inventory technician purchase:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory/technicians/:id/complete-all')
  async completeAllPurchases(@Param('id') id: string, @Request() req: any, @Query('month') month?: string, @Query('year') year?: string) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return { error: 'Month and year are required' };
      }

      const purchases = await this.inventoryTechniciansService.markAllTechnicianPurchasesCompletedForMonth(
        id,
        monthNum,
        yearNum,
        userId,
      );
      return purchases;
    } catch (error) {
      console.error('Error completing all purchases:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory/technicians/purchases/all')
  async getAllPurchases(@Request() req: any, @Query('month') month?: string, @Query('year') year?: string) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (!isNaN(monthNum) && !isNaN(yearNum)) {
        const purchases = await this.inventoryTechniciansService.getAllPurchasesForMonth(monthNum, yearNum, userId);
        return purchases;
      } else {
        const purchases = await this.inventoryTechniciansService.getAllTechnicianPurchases(userId, true);
        return purchases;
      }
    } catch (error) {
      console.error('Error fetching all purchases:', error);
      throw error;
    }
  }


  // Inventory Form Submissions endpoints
  @UseGuards(JwtAuthGuard)
  @Get('inventory-form/submissions')
  async getInventoryFormSubmissions(@Request() req: any, @Query('month') month?: string, @Query('year') year?: string) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return [];
      }

      const submissions = await this.inventoryFormSubmissionsService.findByMonth(monthNum, yearNum, userId);
      return submissions || [];
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      return [];
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory-form/submissions/available-months')
  async getInventoryFormSubmissionsAvailableMonths(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const months = await this.inventoryFormSubmissionsService.getAvailableMonths(userId);
      return months;
    } catch (error) {
      console.error('Error fetching available form submission months:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory-form/submissions/:id')
  async updateInventoryFormSubmission(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const submission = await this.inventoryFormSubmissionsService.update(id, data, userId);
      return submission;
    } catch (error) {
      console.error('Error updating inventory form submission:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory-form/submissions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryFormSubmission(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      await this.inventoryFormSubmissionsService.delete(id, userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory form submission:', error);
      throw error;
    }
  }

  // Inventory Form Config endpoints
  @UseGuards(JwtAuthGuard)
  @Get('inventory-form/config')
  async getInventoryFormConfig(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const formConfig = await this.inventoryFormConfigService.findAll(userId);
      const categories = await this.inventoryCategoriesService.findAll(userId);
      const inventory = await this.inventoryService.findAll(userId);

      return {
        formConfig,
        categories,
        inventory,
      };
    } catch (error) {
      console.error('Error fetching form config:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory-form/config/bulk')
  async bulkUpdateInventoryFormConfig(@Body() body: { configs: any[] }, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      if (!Array.isArray(body.configs)) {
        return { message: 'Configs array is required' };
      }

      const results = await this.inventoryFormConfigService.bulkUpsert(body.configs, userId);
      return { success: true, updated: results.length };
    } catch (error) {
      console.error('Error updating form configs:', error);
      throw error;
    }
  }

  // Inventory Column Definitions endpoints
  @UseGuards(JwtAuthGuard)
  @Get('inventory-column-definitions')
  async getInventoryColumnDefinitions(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const columns = await this.inventoryColumnDefinitionsService.findAll(userId);
      return columns;
    } catch (error) {
      console.error('Error fetching inventory column definitions:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('inventory-column-definitions')
  async createInventoryColumnDefinition(@Body() body: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }

      if (!body.columnKey || !body.columnLabel) {
        return { message: 'Column key and label are required' };
      }

      // Generate column key if not provided (from label)
      const columnKey = body.columnKey || body.columnLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      const column = await this.inventoryColumnDefinitionsService.create(
        {
          columnKey,
          columnLabel: body.columnLabel,
          displayOrder: body.displayOrder ?? 0,
          isVisible: body.isVisible !== false,
        },
        userId
      );
      return column;
    } catch (error) {
      console.error('Error creating inventory column definition:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory-column-definitions/:id')
  async updateInventoryColumnDefinition(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }

      const column = await this.inventoryColumnDefinitionsService.update(
        id,
        {
          columnLabel: body.columnLabel,
          displayOrder: body.displayOrder,
          isVisible: body.isVisible,
        },
        userId
      );
      return column;
    } catch (error) {
      console.error('Error updating inventory column definition:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inventory-column-definitions/:id')
  async deleteInventoryColumnDefinition(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }

      await this.inventoryColumnDefinitionsService.delete(id, userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory column definition:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inventory-column-definitions/reorder')
  async reorderInventoryColumnDefinitions(@Body() body: { updates: Array<{ id: string; displayOrder: number }> }, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }

      if (!Array.isArray(body.updates)) {
        return { message: 'Updates array is required' };
      }

      const results = await this.inventoryColumnDefinitionsService.reorder(body.updates, userId);
      return { success: true, updated: results.length };
    } catch (error) {
      console.error('Error reordering inventory column definitions:', error);
      throw error;
    }
  }

  // Team Member Types endpoints
  @UseGuards(JwtAuthGuard)
  @Get('team-member-types')
  async getTeamMemberTypes(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const types = await this.teamMemberTypesService.findAll(userId);
      return types;
    } catch (error) {
      console.error('Error fetching team member types:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('team-member-types')
  async createTeamMemberType(@Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      if (!data.name || !data.name.trim()) {
        return { message: 'Type name is required' };
      }

      const type = await this.teamMemberTypesService.create({
        name: data.name.trim(),
        isActive: data.isActive !== undefined ? data.isActive : true,
      } as any, userId);

      return type;
    } catch (error) {
      console.error('Error creating team member type:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('team-member-types/:id')
  async updateTeamMemberType(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const existing = await this.teamMemberTypesService.findOne(id, userId);
      if (!existing) {
        return { message: 'Team member type not found' };
      }

      const updateData: any = {};
      if (data.name !== undefined) {
        if (!data.name || !data.name.trim()) {
          return { message: 'Type name cannot be empty' };
        }
        updateData.name = data.name.trim();
      }
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      const type = await this.teamMemberTypesService.update(id, updateData, userId);
      return type;
    } catch (error) {
      // Re-throw BadRequestException to let NestJS handle the status code
      if (error.status === 400 || error instanceof Error && error.message.includes('Cannot')) {
        throw error;
      }
      console.error('Error updating team member type:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('team-member-types/:id')
  async deleteTeamMemberType(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const type = await this.teamMemberTypesService.findOne(id, userId);
      if (!type) {
        return { message: 'Team member type not found' };
      }

      await this.teamMemberTypesService.delete(id, userId);
      return { success: true };
    } catch (error) {
      // Re-throw BadRequestException to let NestJS handle the status code
      if (error.status === 400 || error instanceof Error && error.message.includes('Cannot')) {
        throw error;
      }
      console.error('Error deleting team member type:', error);
      throw error;
    }
  }

  // Team Member Statuses endpoints
  @UseGuards(JwtAuthGuard)
  @Get('team-member-statuses')
  async getTeamMemberStatuses(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const statuses = await this.teamMemberStatusesService.findAll(userId);
      return statuses;
    } catch (error) {
      console.error('Error fetching team member statuses:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('team-member-statuses')
  async createTeamMemberStatus(@Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      if (!data.name || !data.name.trim()) {
        return { message: 'Status name is required' };
      }

      const status = await this.teamMemberStatusesService.create({
        name: data.name.trim(),
        isActive: data.isActive !== undefined ? data.isActive : true,
      } as any, userId);

      return status;
    } catch (error) {
      console.error('Error creating team member status:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('team-member-statuses/:id')
  async updateTeamMemberStatus(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const existing = await this.teamMemberStatusesService.findOne(id, userId);
      if (!existing) {
        return { message: 'Team member status not found' };
      }

      const updateData: any = {};
      if (data.name !== undefined) {
        if (!data.name || !data.name.trim()) {
          return { message: 'Status name cannot be empty' };
        }
        updateData.name = data.name.trim();
      }
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      const status = await this.teamMemberStatusesService.update(id, updateData, userId);
      return status;
    } catch (error) {
      // Re-throw BadRequestException to let NestJS handle the status code
      if (error.status === 400 || error instanceof Error && error.message.includes('Cannot')) {
        throw error;
      }
      console.error('Error updating team member status:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('team-member-statuses/:id')
  async deleteTeamMemberStatus(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      const status = await this.teamMemberStatusesService.findOne(id, userId);
      if (!status) {
        return { message: 'Team member status not found' };
      }

      await this.teamMemberStatusesService.delete(id, userId);
      return { success: true };
    } catch (error) {
      // Re-throw BadRequestException to let NestJS handle the status code
      if (error.status === 400 || error instanceof Error && error.message.includes('Cannot')) {
        throw error;
      }
      console.error('Error deleting team member status:', error);
      throw error;
    }
  }

  // Notification Template endpoints
  @UseGuards(JwtAuthGuard)
  @Get('notification-templates/message')
  async getNotificationMessage(@Request() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }
    const template = await this.notificationTemplateService.getTemplate(userId);
    return { value: template?.template || '' };
  }

  @UseGuards(JwtAuthGuard)
  @Put('notification-templates/message')
  async updateNotificationMessage(@Body() data: { value: string }, @Request() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }
    if (typeof data.value !== 'string') {
      throw new BadRequestException('Invalid message value');
    }
    const template = await this.notificationTemplateService.upsertTemplate(userId, data.value);
    return { value: template.template };
  }

  // Inventory Settings endpoints
  @UseGuards(JwtAuthGuard)
  @Get('settings/inventory/default-ideal-inventory')
  async getDefaultIdealInventory(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedException();
      }
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { defaultIdealInventory: true },
      });
      return { value: user?.defaultIdealInventory || 0 };
    } catch (error) {
      console.error('Error fetching default ideal inventory:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('settings/inventory/default-ideal-inventory')
  async updateDefaultIdealInventory(@Request() req: any, @Body() data: { value: number }) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedException();
      }
      if (typeof data.value !== 'number' || data.value < 0) {
        throw new BadRequestException('Value must be a non-negative number');
      }
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { defaultIdealInventory: data.value },
        select: { defaultIdealInventory: true },
      });
      return { value: user.defaultIdealInventory };
    } catch (error) {
      console.error('Error updating default ideal inventory:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/public-form-key')
  async getPublicFormKey(@Request() req: any) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedException();
      }

      // Get user with publicFormKey
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { publicFormKey: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Generate publicFormKey if it doesn't exist
      let publicFormKey = user.publicFormKey;
      if (!publicFormKey) {
        const crypto = await import('crypto');
        publicFormKey = crypto.randomBytes(32).toString('hex');
        await this.prisma.user.update({
          where: { id: userId },
          data: { publicFormKey },
        });
      }

      return { publicFormKey };
    } catch (error) {
      console.error('Error fetching public form key:', error);
      throw error;
    }
  }

  // Public Inventory Form endpoints (no auth required)
  @Get('public/inventory-form/config')
  async getPublicInventoryFormConfig(@Query('key') key?: string) {
    try {
      // Look up user by publicFormKey if key is provided
      let userId: string | null = null;
      if (key) {
        const user = await this.prisma.user.findUnique({
          where: { publicFormKey: key },
          select: { id: true },
        });
        if (user) {
          userId = user.id;
        } else {
          return { message: 'Invalid form key' };
        }
      }

      if (!userId) {
        return { message: 'Form key is required' };
      }

      const formConfig = await this.inventoryFormConfigService.findAll(userId);
      const allCategories = await this.inventoryCategoriesService.findAll(userId);
      const allInventory = await this.inventoryService.findAll(userId);
      
      // Get team members for this user
      const allTeamMembers = await this.prisma.teamMember.findMany({
        where: { createdById: userId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
        },
      });

      // Filter to only visible categories
      const visibleCategories = allCategories.filter(
        (c) => c.isVisibleOnForm !== false,
      );
      const visibleCategoryIds = new Set(visibleCategories.map((c) => c.id));

      // Group inventory items by category (only include items from visible categories)
      const inventoryByCategory: Record<string, any[]> = {};
      for (const item of allInventory) {
        // Skip items from hidden categories
        if (item.categoryId && !visibleCategoryIds.has(item.categoryId)) {
          continue;
        }

        const category = visibleCategories.find(
          (c) => c.id === item.categoryId,
        );
        const categoryName = category?.name || item.type || 'Other';
        if (!inventoryByCategory[categoryName]) {
          inventoryByCategory[categoryName] = [];
        }
        inventoryByCategory[categoryName].push(item);
      }

      // Get config for each field, using defaults if not configured
      const configByField: Record<string, any> = {};
      for (const config of formConfig) {
        configByField[`${config.categoryName}:${config.fieldName}`] = config;
      }

      return {
        categories: visibleCategories.map((c) => c.name),
        inventoryByCategory,
        formConfig: configByField,
        teamMembers: allTeamMembers.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
        })),
      };
    } catch (error) {
      console.error('Error fetching public form config:', error);
      throw error;
    }
  }

  @Post('public/inventory-form/submit')
  async submitPublicInventoryForm(@Body() body: any, @Query('key') key?: string) {
    try {
      const {
        submitterName,
        productSelections,
        toolSelections,
        additionalNotes,
        returningEmptyGallons,
      } = body;

      if (!submitterName || !submitterName.trim()) {
        return { message: 'Name is required' };
      }

      // Look up user by publicFormKey if key is provided
      let userId: string | null = null;
      if (key) {
        const user = await this.prisma.user.findUnique({
          where: { publicFormKey: key },
          select: { id: true },
        });
        if (user) {
          userId = user.id;
        } else {
          return { message: 'Invalid form key' };
        }
      }

      if (!userId) {
        return { message: 'Form key is required' };
      }

      // Create submission
      const submission = await this.inventoryFormSubmissionsService.create({
        submitterName: submitterName.trim(),
        productSelections: productSelections || {},
        toolSelections: toolSelections || {},
        additionalNotes: additionalNotes || null,
        returningEmptyGallons: returningEmptyGallons || null,
      }, userId);

      // Update inventory totalRequested based on selections
      const allInventory = await this.inventoryService.findAll(userId);

      // Update product requests
      if (productSelections && typeof productSelections === 'object') {
        for (const [itemName, quantity] of Object.entries(productSelections)) {
          if (typeof quantity === 'number' && quantity > 0) {
            const item = allInventory.find((i) => i.name === itemName);
            if (item) {
              const newTotalInventory = Math.max(
                0,
                (item.totalInventory || 0) - quantity,
              );
              const newTotalRequested = (item.totalRequested || 0) + quantity;

              await this.inventoryService.update(item.id, {
                totalInventory: newTotalInventory,
                totalRequested: newTotalRequested,
              }, userId);
            }
          }
        }
      }

      // Update tool requests
      if (toolSelections && typeof toolSelections === 'object') {
        for (const [itemName, quantity] of Object.entries(toolSelections)) {
          if (typeof quantity === 'number' && quantity > 0) {
            const item = allInventory.find((i) => i.name === itemName);
            if (item) {
              const newTotalRequested = (item.totalRequested || 0) + quantity;
              await this.inventoryService.update(item.id, {
                totalRequested: newTotalRequested,
              }, userId);
            }
          }
        }
      }

      // Create InventoryTechnicianPurchase record (matching Replit implementation)
      try {
        // Find or create inventory technician by submitter name
        let technician = await this.inventoryTechniciansService.findByName(submitterName.trim(), userId);
        if (!technician) {
          console.log(`Technician not found, creating new one: ${submitterName.trim()}`);
          technician = await this.inventoryTechniciansService.create({
            techName: submitterName.trim(),
          }, userId);
          console.log(`Created technician with ID: ${technician.id}`);
        } else {
          console.log(`Found existing technician with ID: ${technician.id}`);
        }

        // Format date as MM/DD/YYYY in America/New_York timezone
        const nowNY = new Date().toLocaleString('en-US', {
          timeZone: 'America/New_York',
        });
        const dateNY = new Date(nowNY);
        const day = String(dateNY.getDate()).padStart(2, '0');
        const month = String(dateNY.getMonth() + 1).padStart(2, '0');
        const year = dateNY.getFullYear();
        const formattedDate = `${month}/${day}/${year}`;

        // Combine products and tools into items list
        const allItemsBought: string[] = [];

        if (productSelections && typeof productSelections === 'object') {
          for (const [itemName, quantity] of Object.entries(productSelections)) {
            if (typeof quantity === 'number' && quantity > 0) {
              allItemsBought.push(`${itemName} (${quantity})`);
            }
          }
        }

        if (toolSelections && typeof toolSelections === 'object') {
          for (const [itemName, quantity] of Object.entries(toolSelections)) {
            if (typeof quantity === 'number' && quantity > 0) {
              allItemsBought.push(`${itemName} (${quantity})`);
            }
          }
        }

        // Format as numbered list with newlines
        const itemsRaw = allItemsBought
          .map((item, index) => `${index + 1}. ${item}`)
          .join('\n');

        // Create purchase record if there are items
        if (allItemsBought.length > 0) {
          await this.inventoryTechniciansService.createTechnicianPurchase({
            technician: { connect: { id: technician.id } },
            purchaseDate: formattedDate,
            itemsRaw: itemsRaw,
            itemsParsed: {
              products: productSelections || {},
              tools: toolSelections || {},
            },
            isCompleted: false,
          }, userId);

          // Update technician's latest purchase date
          await this.inventoryTechniciansService.update(technician.id, {
            latestPurchaseDate: formattedDate,
          }, userId);

          console.log(`Created purchase record for ${submitterName.trim()}: ${itemsRaw}`);
        }
      } catch (techError) {
        // Log error but don't fail the entire submission
        console.error('Error creating technician purchase record:', techError);
        console.error('Error stack:', techError.stack);
      }

      return submission;
    } catch (error) {
      console.error('Error submitting public form:', error);
      throw error;
    }
  }
}