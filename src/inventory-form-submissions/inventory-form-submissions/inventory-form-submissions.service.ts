import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryFormSubmission, Prisma } from '@prisma/client';

@Injectable()
export class InventoryFormSubmissionsService {
  private readonly logger = new Logger(InventoryFormSubmissionsService.name);

  constructor(private prisma: PrismaService) {}

  // Get all submissions - ported from storage.ts
  async findAll(): Promise<InventoryFormSubmission[]> {
    try {
      return this.prisma.inventoryFormSubmission.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching all form submissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Get submissions by month/year - ported from storage.ts
  async findByMonth(month: number, year: number): Promise<InventoryFormSubmission[]> {
    try {
      const allSubmissions = await this.prisma.inventoryFormSubmission.findMany({
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
  async findOne(id: string): Promise<InventoryFormSubmission | null> {
    try {
      return this.prisma.inventoryFormSubmission.findUnique({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Error fetching form submission: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Create submission - ported from storage.ts
  async create(data: Prisma.InventoryFormSubmissionCreateInput): Promise<InventoryFormSubmission> {
    try {
      return this.prisma.inventoryFormSubmission.create({
        data,
      });
    } catch (error) {
      this.logger.error(`Error creating form submission: ${error.message}`, error.stack);
      throw error;
    }
  }
}
