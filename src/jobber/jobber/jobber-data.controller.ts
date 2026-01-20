import { Controller, Get, Query, UseGuards, Request, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { JobberOAuthService } from '../../auth/jobber/jobber-oauth.service';
import { JobberClientsService } from './jobber-clients.service';
import { JobberQuotesService } from './jobber-quotes.service';
import { JobberJobsService } from './jobber-jobs.service';

@Controller('jobber')
@UseGuards(JwtAuthGuard)
export class JobberDataController {
  private readonly logger = new Logger(JobberDataController.name);
  private readonly cacheTtlMs = 60 * 1000;
  private readonly clientsCache = new Map<string, { expiresAt: number; data: any }>();
  private readonly quotesCache = new Map<string, { expiresAt: number; data: any }>();
  private readonly jobsCache = new Map<string, { expiresAt: number; data: any }>();

  constructor(
    private jobberOAuthService: JobberOAuthService,
    private jobberClientsService: JobberClientsService,
    private jobberQuotesService: JobberQuotesService,
    private jobberJobsService: JobberJobsService,
  ) {}

  @Get('clients')
  async getClients(@Request() req: any, @Query('first') first?: string, @Query('after') after?: string) {
    try {
      this.logger.log('📥 GET /jobber/clients called');
      this.logger.log(`User ID: ${req.user.userId}`);
      this.logger.log(`Query params: first=${first}, after=${after}`);

      const userId = req.user.userId;
      const limit = first ? parseInt(first, 10) : 20;
      const cacheKey = `${userId}:${limit}:${after || ''}`;
      const cached = this.clientsCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        this.logger.log('✅ Returning cached clients response');
        return cached.data;
      }
      
      let accessToken: string;
      try {
        accessToken = await this.jobberOAuthService.getValidAccessToken(userId);
        this.logger.log('✅ Access token retrieved successfully');
      } catch (tokenError: any) {
        // If it's a "no Jobber token" error, return 400 instead of 401
        if (tokenError.message?.includes('No Jobber access token') || tokenError.message?.includes('Jobber account')) {
          this.logger.warn('⚠️ Jobber not connected for user:', userId);
          throw new HttpException(
            {
              message: 'Jobber account not connected. Please connect your Jobber account in Settings.',
              code: 'JOBBER_NOT_CONNECTED',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        throw tokenError;
      }

      this.logger.log(`Fetching ${limit} clients...`);
      
      const result = await this.jobberClientsService.getAllClients(limit, after, accessToken);
      this.logger.log(`✅ Successfully fetched ${result?.data?.clients?.nodes?.length || 0} clients`);
      this.clientsCache.set(cacheKey, { data: result, expiresAt: Date.now() + this.cacheTtlMs });
      
      return result;
    } catch (error: any) {
      this.logger.error('❌ Error fetching clients:', error);
      this.logger.error('Error message:', error.message);
      this.logger.error('Error status:', error.status);
      this.logger.error('Error code:', error.code);
      
      // If it's already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Handle rate limiting
      if (error.status === 429 || error.code === 'RATE_LIMIT_EXCEEDED') {
        throw new HttpException(
          {
            message: error.message || 'Jobber API rate limit exceeded. Please wait a moment and try again.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      
      // For other errors, wrap them properly
      throw new HttpException(
        {
          message: error.message || 'Failed to fetch clients',
          error: error.response?.data || error.message,
          code: error.code || 'UNKNOWN_ERROR',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('quotes')
  async getQuotes(@Request() req: any, @Query('first') first?: string, @Query('after') after?: string) {
    try {
      this.logger.log('📥 GET /jobber/quotes called');
      this.logger.log(`User ID: ${req.user.userId}`);

      const userId = req.user.userId;
      const limit = first ? parseInt(first, 10) : 20;
      const cacheKey = `${userId}:${limit}:${after || ''}`;
      const cached = this.quotesCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        this.logger.log('✅ Returning cached quotes response');
        return cached.data;
      }
      
      let accessToken: string;
      try {
        accessToken = await this.jobberOAuthService.getValidAccessToken(userId);
      } catch (tokenError: any) {
        if (tokenError.message?.includes('No Jobber access token') || tokenError.message?.includes('Jobber account')) {
          throw new HttpException(
            {
              message: 'Jobber account not connected. Please connect your Jobber account in Settings.',
              code: 'JOBBER_NOT_CONNECTED',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        throw tokenError;
      }
      
      const result = await this.jobberQuotesService.getAllQuotes(limit, after, accessToken);
      this.logger.log(`✅ Successfully fetched ${result?.data?.quotes?.nodes?.length || 0} quotes`);
      this.quotesCache.set(cacheKey, { data: result, expiresAt: Date.now() + this.cacheTtlMs });
      return result;
    } catch (error: any) {
      this.logger.error('❌ Error fetching quotes:', error);
      this.logger.error('Error status:', error.status);
      this.logger.error('Error code:', error.code);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error.status === 429 || error.code === 'RATE_LIMIT_EXCEEDED') {
        throw new HttpException(
          {
            message: error.message || 'Jobber API rate limit exceeded. Please wait a moment and try again.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      
      throw new HttpException(
        {
          message: error.message || 'Failed to fetch quotes',
          error: error.response?.data || error.message,
          code: error.code || 'UNKNOWN_ERROR',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('jobs')
  async getJobs(@Request() req: any, @Query('first') first?: string, @Query('after') after?: string) {
    try {
      this.logger.log('📥 GET /jobber/jobs called');
      this.logger.log(`User ID: ${req.user.userId}`);

      const userId = req.user.userId;
      const limit = first ? parseInt(first, 10) : 20;
      const cacheKey = `${userId}:${limit}:${after || ''}`;
      const cached = this.jobsCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        this.logger.log('✅ Returning cached jobs response');
        return cached.data;
      }
      
      let accessToken: string;
      try {
        accessToken = await this.jobberOAuthService.getValidAccessToken(userId);
      } catch (tokenError: any) {
        if (tokenError.message?.includes('No Jobber access token') || tokenError.message?.includes('Jobber account')) {
          throw new HttpException(
            {
              message: 'Jobber account not connected. Please connect your Jobber account in Settings.',
              code: 'JOBBER_NOT_CONNECTED',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        throw tokenError;
      }
      
      const result = await this.jobberJobsService.getAllJobs(limit, after, accessToken);
      this.logger.log(`✅ Successfully fetched ${result?.data?.jobs?.nodes?.length || 0} jobs`);
      this.jobsCache.set(cacheKey, { data: result, expiresAt: Date.now() + this.cacheTtlMs });
      return result;
    } catch (error: any) {
      this.logger.error('❌ Error fetching jobs:', error);
      this.logger.error('Error status:', error.status);
      this.logger.error('Error code:', error.code);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error.status === 429 || error.code === 'RATE_LIMIT_EXCEEDED') {
        throw new HttpException(
          {
            message: error.message || 'Jobber API rate limit exceeded. Please wait a moment and try again.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      
      throw new HttpException(
        {
          message: error.message || 'Failed to fetch jobs',
          error: error.response?.data || error.message,
          code: error.code || 'UNKNOWN_ERROR',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
