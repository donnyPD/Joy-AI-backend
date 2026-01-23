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
}
