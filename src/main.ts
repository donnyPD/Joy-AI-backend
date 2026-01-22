import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env file FIRST - before any other imports
const envPath = resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not defined in .env file!');
  console.error('Please check your .env file and ensure DATABASE_URL is set.');
  console.error(`Looking for .env at: ${envPath}`);
  process.exit(1);
}

console.log('✅ DATABASE_URL loaded successfully');

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { raw } from 'body-parser';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });
  
  // Stripe webhook requires raw body for signature verification
  app.use('/api/billing/webhook', raw({ type: 'application/json' }));

  // Enable CORS
  app.enableCors();
  
  // Increase body size limit for JSON requests (to handle base64-encoded images)
  // NestJS uses Express under the hood, so we can access the Express instance
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Set global prefix for all routes
  app.setGlobalPrefix('api');
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
