import { Controller, Get, Post, Patch, Delete, Put, Body, Param, Query, HttpCode, HttpStatus, Request, UseGuards, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
import { CustomMetricDefinitionsService } from '../../custom-metric-definitions/custom-metric-definitions/custom-metric-definitions.service';
import { TeamMemberTypesService } from '../../team-member-types/team-member-types/team-member-types.service';
import { TeamMemberStatusesService } from '../../team-member-statuses/team-member-statuses/team-member-statuses.service';
import { NotificationTemplateService } from '../../notification-templates/notification-templates/notification-template.service';

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
    private customMetricDefinitionsService: CustomMetricDefinitionsService,
    private teamMemberTypesService: TeamMemberTypesService,
    private teamMemberStatusesService: TeamMemberStatusesService,
    private notificationTemplateService: NotificationTemplateService,
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

  @Put('inventory/notes/:id')
  async updateInventoryNote(@Param('id') id: string, @Body() data: any) {
    try {
      const note = await this.inventoryNotesService.update(id, data);
      return note;
    } catch (error) {
      console.error('Error updating inventory note:', error);
      throw error;
    }
  }

  @Delete('inventory/notes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryNote(@Param('id') id: string) {
    try {
      await this.inventoryNotesService.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory note:', error);
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

  @Put('inventory/purchases/:id')
  async updateInventoryPurchase(@Param('id') id: string, @Body() data: any) {
    try {
      const purchase = await this.inventoryPurchasesService.update(id, data);
      return purchase;
    } catch (error) {
      console.error('Error updating inventory purchase:', error);
      throw error;
    }
  }

  @Delete('inventory/purchases/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryPurchase(@Param('id') id: string) {
    try {
      await this.inventoryPurchasesService.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory purchase:', error);
      throw error;
    }
  }

  // Inventory Categories endpoints
  @Get('inventory/categories')
  async getInventoryCategories() {
    try {
      const categories = await this.inventoryCategoriesService.findAll();
      return categories;
    } catch (error) {
      console.error('Error fetching inventory categories:', error);
      throw error;
    }
  }

  @Post('inventory/categories')
  async createInventoryCategory(@Body() data: any) {
    try {
      const { name } = data;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return { error: 'Category name is required' };
      }
      const category = await this.inventoryCategoriesService.create({
        name: name.trim(),
        isVisibleOnForm: data.isVisibleOnForm !== undefined ? data.isVisibleOnForm : true,
      });
      return category;
    } catch (error) {
      console.error('Error creating inventory category:', error);
      throw error;
    }
  }

  @Patch('inventory/categories/:id')
  async updateInventoryCategory(@Param('id') id: string, @Body() data: any) {
    try {
      const category = await this.inventoryCategoriesService.update(id, data);
      return category;
    } catch (error) {
      console.error('Error updating inventory category:', error);
      throw error;
    }
  }

  @Delete('inventory/categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryCategory(@Param('id') id: string) {
    try {
      await this.inventoryCategoriesService.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory category:', error);
      throw error;
    }
  }

  // Inventory endpoints - NOTE: Must come before /inventory/:id
  @Get('inventory')
  async getInventory(@Query('type') type?: string, @Query('categoryId') categoryId?: string) {
    try {
      let items;
      if (categoryId) {
        items = await this.inventoryService.findByCategory(categoryId);
      } else if (type) {
        items = await this.inventoryService.findByType(type);
      } else {
        items = await this.inventoryService.findAll();
      }
      return items;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  @Post('inventory')
  async createInventoryItem(@Body() data: any) {
    try {
      const {
        name,
        type,
        categoryId,
        totalRequested,
        totalInventory,
        pricePerUnit,
        threshold,
      } = data;

      if (!name || !type || !categoryId) {
        return { error: 'Name, type, and categoryId are required' };
      }

      // Verify category exists
      const category = await this.inventoryCategoriesService.findOne(categoryId);
      if (!category) {
        return { error: 'Invalid category' };
      }

      // Get the next row number for this category - ported exact logic
      const existingItems = await this.inventoryService.findByCategory(categoryId);
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
        rowNumber: maxRowNumber + 1,
      });

      return newItem;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  @Get('inventory/:id')
  async getInventoryItem(@Param('id') id: string) {
    try {
      const item = await this.inventoryService.findOne(id);
      if (!item) {
        return { error: 'Inventory item not found' };
      }
      return item;
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  }

  @Put('inventory/:id')
  async updateInventoryItem(@Param('id') id: string, @Body() data: any) {
    try {
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

      const item = await this.inventoryService.update(id, updateData);
      return item;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  @Delete('inventory/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryItem(@Param('id') id: string) {
    try {
      await this.inventoryService.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  // Inventory Technicians endpoints - NOTE: Must come before /inventory/:id
  @Get('inventory/technicians')
  async getInventoryTechnicians() {
    try {
      const technicians = await this.inventoryTechniciansService.getLatestTechnicianPurchases();
      return technicians;
    } catch (error) {
      console.error('Error fetching inventory technicians:', error);
      throw error;
    }
  }

  @Get('inventory/technicians/:id/purchases')
  async getTechnicianPurchases(@Param('id') id: string) {
    try {
      const purchases = await this.inventoryTechniciansService.getTechnicianPurchases(id);
      return purchases;
    } catch (error) {
      console.error('Error fetching technician purchases:', error);
      throw error;
    }
  }

  @Get('inventory/technicians-by-month')
  async getTechniciansByMonth(@Query('month') month?: string, @Query('year') year?: string, @Query('includeCompleted') includeCompleted?: string) {
    try {
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');
      const includeHidden = includeCompleted === 'true';

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return [];
      }

      const technicians = await this.inventoryTechniciansService.getTechnicianPurchasesByMonth(
        monthNum,
        yearNum,
        includeHidden,
      );
      return technicians || [];
    } catch (error) {
      console.error('Error fetching technicians by month:', error);
      return [];
    }
  }

  @Patch('inventory/technicians/purchases/:id/complete')
  async completePurchase(@Param('id') id: string) {
    try {
      const purchase = await this.inventoryTechniciansService.markPurchaseCompleted(id);
      if (!purchase) {
        return { error: 'Purchase not found' };
      }
      return purchase;
    } catch (error) {
      console.error('Error completing purchase:', error);
      throw error;
    }
  }

  @Patch('inventory/technicians/purchases/:id/uncomplete')
  async uncompletePurchase(@Param('id') id: string) {
    try {
      const purchase = await this.inventoryTechniciansService.markPurchaseUncompleted(id);
      if (!purchase) {
        return { error: 'Purchase not found' };
      }
      return purchase;
    } catch (error) {
      console.error('Error uncompleting purchase:', error);
      throw error;
    }
  }

  @Patch('inventory/technicians/:id/complete-all')
  async completeAllPurchases(@Param('id') id: string, @Query('month') month?: string, @Query('year') year?: string) {
    try {
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return { error: 'Month and year are required' };
      }

      const purchases = await this.inventoryTechniciansService.markAllTechnicianPurchasesCompletedForMonth(
        id,
        monthNum,
        yearNum,
      );
      return purchases;
    } catch (error) {
      console.error('Error completing all purchases:', error);
      throw error;
    }
  }

  @Get('inventory/technicians/purchases/all')
  async getAllPurchases(@Query('month') month?: string, @Query('year') year?: string) {
    try {
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (!isNaN(monthNum) && !isNaN(yearNum)) {
        const purchases = await this.inventoryTechniciansService.getAllPurchasesForMonth(monthNum, yearNum);
        return purchases;
      } else {
        const purchases = await this.inventoryTechniciansService.getAllTechnicianPurchases(true);
        return purchases;
      }
    } catch (error) {
      console.error('Error fetching all purchases:', error);
      throw error;
    }
  }

  // Inventory Notes endpoints (for inventory page, not team member specific)
  @Get('inventory/notes')
  async getInventoryNotes(@Query('month') month?: string, @Query('year') year?: string) {
    try {
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return [];
      }

      // Get all notes and filter by month/year - ported exact logic
      const allNotes = await this.inventoryNotesService.findAll();
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

  // Inventory Snapshots endpoints
  @Get('inventory/snapshot')
  async getInventorySnapshot(@Query('month') month?: string, @Query('year') year?: string) {
    try {
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return { error: 'Month and year are required' };
      }

      const snapshot = await this.inventorySnapshotsService.findByMonthYear(monthNum, yearNum);
      return snapshot || null;
    } catch (error) {
      console.error('Error fetching inventory snapshot:', error);
      throw error;
    }
  }

  @Get('inventory/snapshot-months')
  async getSnapshotMonths() {
    try {
      const months = await this.inventorySnapshotsService.getAvailableMonths();
      return months;
    } catch (error) {
      console.error('Error fetching snapshot months:', error);
      throw error;
    }
  }

  @Post('inventory/auto-snapshot')
  async autoCreateSnapshot() {
    try {
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
      const existingSnapshot = await this.inventorySnapshotsService.findByMonthYear(prevMonth, prevYear);

      if (!existingSnapshot) {
        // Create snapshot for previous month using current inventory data
        const inventoryItems = await this.inventoryService.findAll();
        const snapshotData = inventoryItems.map((item) => ({
          name: item.name,
          type: item.type,
          totalRequested: item.totalRequested || 0,
          totalInventory: item.totalInventory || 0,
          pricePerUnit: item.pricePerUnit,
          threshold: item.threshold || 0,
          rowNumber: item.rowNumber,
        }));

        const snapshot = await this.inventorySnapshotsService.create(prevMonth, prevYear, snapshotData);
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
  @Get('inventory/stores')
  async getInventoryStores() {
    try {
      const stores = await this.inventoryStoresService.findAll();
      return stores;
    } catch (error) {
      console.error('Error fetching inventory stores:', error);
      throw error;
    }
  }

  @Post('inventory/stores')
  async createInventoryStore(@Body() data: any) {
    try {
      const { name } = data;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return { error: 'Store name is required' };
      }
      const store = await this.inventoryStoresService.create({
        name: name.trim(),
      });
      return store;
    } catch (error) {
      console.error('Error creating inventory store:', error);
      throw error;
    }
  }

  @Delete('inventory/stores/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryStore(@Param('id') id: string) {
    try {
      await this.inventoryStoresService.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting inventory store:', error);
      throw error;
    }
  }

  // Inventory Purchases endpoints (different from technician purchases)
  @Get('inventory/purchases')
  async getInventoryPurchases(@Query('month') month?: string, @Query('year') year?: string) {
    try {
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return [];
      }

      const purchases = await this.inventoryPurchaseItemsService.findByMonth(monthNum, yearNum);
      return purchases || [];
    } catch (error) {
      console.error('Error fetching inventory purchases:', error);
      return [];
    }
  }

  @Post('inventory/purchases')
  async createInventoryPurchases(@Body() data: any) {
    try {
      const { purchases } = data;
      if (!purchases || !Array.isArray(purchases) || purchases.length === 0) {
        return { error: 'Purchases array is required' };
      }

      // Transform purchases to Prisma format
      const purchaseData = purchases.map((p: any) => ({
        orderId: p.orderId || `LEGACY-${Date.now()}-${Math.random()}`,
        itemId: p.itemId || null,
        itemName: p.itemName,
        orderedFrom: p.orderedFrom,
        amount: p.amount,
        quantity: p.quantity || 1,
        purchasedAt: p.purchasedAt,
        ...(p.itemId ? { item: { connect: { id: p.itemId } } } : {}),
      }));

      const created = await this.inventoryPurchaseItemsService.createMany(purchaseData);
      return created;
    } catch (error) {
      console.error('Error creating inventory purchases:', error);
      throw error;
    }
  }

  // Inventory Form Submissions endpoints
  @Get('inventory-form/submissions')
  async getInventoryFormSubmissions(@Query('month') month?: string, @Query('year') year?: string) {
    try {
      const monthNum = parseInt(month || '');
      const yearNum = parseInt(year || '');

      if (isNaN(monthNum) || isNaN(yearNum)) {
        return [];
      }

      const submissions = await this.inventoryFormSubmissionsService.findByMonth(monthNum, yearNum);
      return submissions || [];
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      return [];
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
}