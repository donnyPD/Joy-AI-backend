import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomMetricDefinition, Prisma } from '@prisma/client';

@Injectable()
export class CustomMetricDefinitionsService {
  private readonly logger = new Logger(CustomMetricDefinitionsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(createdById: string): Promise<CustomMetricDefinition[]> {
    try {
      return this.prisma.customMetricDefinition.findMany({
        where: { createdById },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching custom metric definitions: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, createdById: string): Promise<CustomMetricDefinition | null> {
    try {
      return this.prisma.customMetricDefinition.findFirst({
        where: { 
          id,
          createdById,
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching custom metric definition: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(data: Prisma.CustomMetricDefinitionCreateInput, createdById: string): Promise<CustomMetricDefinition> {
    try {
      // Exclude createdBy relation and use createdById directly
      const { createdBy, ...dataWithoutRelation } = data as any;
      const metric = await this.prisma.customMetricDefinition.create({
        data: {
          ...dataWithoutRelation,
          createdById,
        } as Prisma.CustomMetricDefinitionUncheckedCreateInput,
      });
      this.logger.log(`Created custom metric definition: ${metric.id} by user: ${createdById}`);
      return metric;
    } catch (error) {
      this.logger.error(`Error creating custom metric definition: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: Prisma.CustomMetricDefinitionUpdateInput, createdById: string): Promise<CustomMetricDefinition> {
    try {
      // First verify the record belongs to the user
      const existing = await this.findOne(id, createdById);
      if (!existing) {
        throw new NotFoundException(`Custom metric definition with ID ${id} not found`);
      }

      const metric = await this.prisma.customMetricDefinition.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated custom metric definition: ${id}`);
      return metric;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Custom metric definition with ID ${id} not found`);
      }
      this.logger.error(`Error updating custom metric definition: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string, createdById: string): Promise<void> {
    try {
      // First verify the record belongs to the user
      const existing = await this.findOne(id, createdById);
      if (!existing) {
        throw new NotFoundException(`Custom metric definition with ID ${id} not found`);
      }

      await this.prisma.customMetricDefinition.delete({
        where: { id },
      });
      this.logger.log(`Deleted custom metric definition: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Custom metric definition with ID ${id} not found`);
      }
      this.logger.error(`Error deleting custom metric definition: ${error.message}`, error.stack);
      throw error;
    }
  }
}
