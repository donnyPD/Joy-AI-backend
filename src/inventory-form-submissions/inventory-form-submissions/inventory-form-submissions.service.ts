import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryFormSubmission, Prisma } from '@prisma/client';

@Injectable()
export class InventoryFormSubmissionsService {
  private readonly logger = new Logger(InventoryFormSubmissionsService.name);

  constructor(private prisma: PrismaService) {}

  // Get all submissions - ported from storage.ts
  async findAll(userId: string): Promise<InventoryFormSubmission[]> {
    try {
      return this.prisma.inventoryFormSubmission.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching all form submissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Get submissions by month/year - ported from storage.ts
  async findByMonth(month: number, year: number, userId: string): Promise<InventoryFormSubmission[]> {
    try {
      const allSubmissions = await this.prisma.inventoryFormSubmission.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      // Filter by month/year from createdAt
      return allSubmissions.filter((submission) => {
        const submissionDate = new Date(submission.createdAt);
        return (
          submissionDate.getMonth() + 1 === month &&
          submissionDate.getFullYear() === year
        );
      });
    } catch (error) {
      this.logger.error(`Error fetching form submissions by month: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Get single submission - ported from storage.ts
  async findOne(id: string, userId: string): Promise<InventoryFormSubmission | null> {
    try {
      return this.prisma.inventoryFormSubmission.findFirst({
        where: { id, userId },
      });
    } catch (error) {
      this.logger.error(`Error fetching form submission: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Create submission - ported from storage.ts
  async create(data: Prisma.InventoryFormSubmissionCreateInput, userId: string): Promise<InventoryFormSubmission> {
    try {
      const { user, ...dataWithoutUser } = data as any;
      return this.prisma.inventoryFormSubmission.create({
        data: {
          ...dataWithoutUser,
          user: { connect: { id: userId } }, // Use relation syntax as Prisma requires
        },
      });
    } catch (error) {
      this.logger.error(`Error creating form submission: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Update submission
  async update(id: string, data: Prisma.InventoryFormSubmissionUpdateInput, userId: string): Promise<InventoryFormSubmission> {
    try {
      // First verify the submission belongs to the user
      const existing = await this.prisma.inventoryFormSubmission.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new NotFoundException(`Inventory form submission with ID ${id} not found`);
      }

      const submission = await this.prisma.inventoryFormSubmission.update({
        where: { id },
        data,
      });
      this.logger.log(`Updated inventory form submission: ${id}`);
      return submission;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory form submission with ID ${id} not found`);
      }
      this.logger.error(`Error updating form submission: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Delete submission
  async delete(id: string, userId: string): Promise<void> {
    try {
      // First verify the submission belongs to the user
      const existing = await this.prisma.inventoryFormSubmission.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new NotFoundException(`Inventory form submission with ID ${id} not found`);
      }

      await this.prisma.inventoryFormSubmission.delete({
        where: { id },
      });
      this.logger.log(`Deleted inventory form submission: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Inventory form submission with ID ${id} not found`);
      }
      this.logger.error(`Error deleting form submission: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Get available months from form submissions
  async getAvailableMonths(userId: string): Promise<Array<{ month: number; year: number }>> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ month: number; year: number }>>`
        SELECT DISTINCT
          EXTRACT(MONTH FROM created_at)::integer as month,
          EXTRACT(YEAR FROM created_at)::integer as year
        FROM inventory_form_submissions
        WHERE user_id = ${userId}
        ORDER BY year DESC, month DESC
      `;

      return result;
    } catch (error) {
      this.logger.error(`Error fetching available form submission months: ${error.message}`, error.stack);
      throw error;
    }
  }
}
