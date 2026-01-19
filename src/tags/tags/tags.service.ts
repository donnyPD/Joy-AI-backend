import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private prisma: PrismaService) {}

  async syncTagsToClient(clientJId: string, tags: Array<{ id: string; label: string }>) {
    try {
      if (!clientJId || !tags || tags.length === 0) {
        return;
      }

      this.logger.log(`Syncing ${tags.length} tags to client: ${clientJId}`);

      for (const tag of tags) {
        await this.prisma.tag.upsert({
          where: { jId: tag.id },
          update: {
            label: tag.label,
            clientJId: clientJId,
          },
          create: {
            jId: tag.id,
            label: tag.label,
            clientJId: clientJId,
          },
        });
      }

      this.logger.log(`✅ Tags synced to client: ${clientJId}`);
    } catch (error) {
      this.logger.error('Error syncing tags to client:', error);
      throw error;
    }
  }

  async getTagsByClient(clientJId: string) {
    return this.prisma.tag.findMany({
      where: { clientJId },
      orderBy: { label: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.tag.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(jId: string) {
    return this.prisma.tag.findUnique({
      where: { jId },
    });
  }
}
