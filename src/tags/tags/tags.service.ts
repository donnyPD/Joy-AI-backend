import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private prisma: PrismaService) {}

  async upsertTagsDb(input: {
    clientJId: string;
    displayName?: string;
    mainPhones?: string;
    emails?: string;
    createdDate?: Date | string | null;
    tags: string[];
  }) {
    try {
      const { clientJId, displayName, mainPhones, emails, createdDate, tags } = input;
      if (!clientJId || !tags || tags.length === 0) {
        return;
      }

      const normalizedTags = tags
        .map((t) => (t || '').trim())
        .filter((t) => t.length > 0);
      if (normalizedTags.length === 0) {
        return;
      }

      const existing = await this.prisma.tagsDb.findUnique({
        where: { clientJId },
      });

      const existingTags = (existing?.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const mergedTags = this.mergeTagsCaseInsensitive(existingTags, normalizedTags);
      const mergedTagsString = mergedTags.join(', ');

      const createdDateValue = existing?.createdDate || this.safeParseDate(createdDate);

      await this.prisma.tagsDb.upsert({
        where: { clientJId },
        create: {
          clientJId,
          displayName: displayName || null,
          mainPhones: mainPhones || null,
          emails: emails || null,
          createdDate: createdDateValue || null,
          tags: mergedTagsString,
        },
        update: {
          displayName: displayName || existing?.displayName,
          mainPhones: mainPhones || existing?.mainPhones,
          emails: emails || existing?.emails,
          createdDate: createdDateValue,
          tags: mergedTagsString,
        },
      });

      this.logger.log(`✅ TagsDb upserted for client: ${clientJId}`);
    } catch (error) {
      this.logger.error('Error upserting TagsDb:', error);
      throw error;
    }
  }

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

  private safeParseDate(value?: Date | string | null): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? undefined : value;
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private mergeTagsCaseInsensitive(existing: string[], incoming: string[]) {
    const result: string[] = [];
    const seen = new Set<string>();

    const addTag = (tag: string) => {
      const key = tag.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(tag);
      }
    };

    existing.forEach(addTag);
    incoming.forEach(addTag);

    return result;
  }
}
