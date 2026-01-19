import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl || databaseUrl.trim() === '') {
      throw new Error(
        [
          'DATABASE_URL is not set in process.env.',
          'Make sure .env exists and has DATABASE_URL.',
          'Example: DATABASE_URL=postgresql://user:password@localhost:5432/joy_cleaning?schema=public',
        ].join(' ')
      );
    }

    // Prisma 7.x requires an adapter or accelerateUrl
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
