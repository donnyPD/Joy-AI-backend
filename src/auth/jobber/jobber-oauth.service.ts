import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AuthService } from '../auth.service';
import { WebhookService } from '../../jobber/webhook/webhook.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JobberOAuthService {
  private readonly logger = new Logger(JobberOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private webhookService: WebhookService,
    private jwtService: JwtService,
  ) {
    this.clientId = this.configService.get<string>('JOBBER_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('JOBBER_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get<string>('JOBBER_REDIRECT_URI') || '';
  }

  private encodeAccountGid(accountNumericId: string | number): string {
    const gid = `gid://Jobber/Account/${String(accountNumericId)}`;
    return Buffer.from(gid, 'utf8').toString('base64');
  }

  private tryGetAccountIdFromAccessToken(accessToken: string): string | null {
    try {
      const parts = accessToken.split('.');
      if (parts.length < 2) return null;

      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson) as any;

      const accountId = payload?.accountId ?? payload?.account_id;
      if (!accountId) return null;

      // Sometimes it could already be an encoded Jobber id
      if (typeof accountId === 'string' && accountId.startsWith('Z2lkOi8v')) {
        return accountId;
      }

      return this.encodeAccountGid(accountId);
    } catch {
      return null;
    }
  }

  getOAuthUrl(userId: string): { authUrl: string } {
    console.log('🔗 Generating OAuth URL...');
    console.log('Client ID:', this.clientId ? 'Set' : 'Missing');
    console.log('Redirect URI:', this.redirectUri);
    console.log('User ID for state:', userId);
    
    const baseUrl = 'https://api.getjobber.com/api/oauth/authorize';
    const state = this.jwtService.sign({ userId }, { expiresIn: '15m' });
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state,
    });

    const authUrl = `${baseUrl}?${params.toString()}`;
    console.log('Generated OAuth URL:', authUrl);
    
    return {
      authUrl,
    };
  }

  async handleCallback(code: string, state: string | undefined) {
    console.log('🔄 Processing OAuth callback...');
    console.log('Authorization code:', code ? 'Received' : 'Missing');
    console.log('State:', state ? 'Received' : 'Missing');

    if (!state) {
      throw new UnauthorizedException('Missing state parameter');
    }

    let userId: string;
    try {
      const payload = this.jwtService.verify<{ userId: string }>(state);
      userId = payload.userId;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired state parameter');
    }

    console.log('User ID from state:', userId);
    
    try {
      // Exchange code for access token
      console.log('📤 Exchanging authorization code for access token...');
      const tokenResponse = await axios.post(
        'https://api.getjobber.com/api/oauth/token',
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      console.log('✅ Access token received');
      console.log('Token length:', access_token?.length || 0);
      console.log('Refresh token:', refresh_token ? 'Received' : 'Missing');
      console.log('Refresh token length:', refresh_token?.length || 0);
      console.log('Expires in:', expires_in, 'seconds');
      
      // Validate that we received a refresh token
      if (!refresh_token) {
        this.logger.error('⚠️ WARNING: No refresh token received from Jobber OAuth response!');
        this.logger.error('This may cause issues with token refresh later.');
      }

      // Calculate expiration time
      const expiresAt = expires_in
        ? new Date(Date.now() + expires_in * 1000)
        : new Date(Date.now() + 3600 * 1000); // Default 1 hour if not provided

      const accountIdFromToken = this.tryGetAccountIdFromAccessToken(access_token) || '';
      const accountId = accountIdFromToken;

      console.log('✅ Account info received');
      console.log('Account ID (token):', accountId || '(empty)');

      if (!accountId) {
        throw new Error(
          'Failed to fetch Jobber account ID during OAuth callback. Token payload did not include accountId.',
        );
      }

      // Save token to user (including refresh token and expiration)
      console.log('💾 Saving Jobber token to user record...');
      this.logger.log(`Saving tokens for user ${userId}, accountId: ${accountId}`);
      this.logger.log(`Access token length: ${access_token?.length || 0}`);
      this.logger.log(`Refresh token: ${refresh_token ? 'Present' : 'Missing'}`);
      this.logger.log(`Token expires at: ${expiresAt?.toISOString() || 'Not set'}`);
      
      await this.authService.updateJobberToken(
        userId,
        access_token,
        accountId,
        refresh_token, // Always use the new refresh token from OAuth response
        expiresAt,
      );
      console.log('✅ Token saved to database');
      this.logger.log('✅ Tokens saved successfully to database');

      // Register webhooks for this user
      console.log('🔔 Registering webhooks for user...');
      this.logger.log(`Starting webhook registration for user ${userId}...`);
      try {
        await this.webhookService.registerAllWebhooks(access_token);
        console.log(`✅ Webhooks registered for user: ${userId}`);
        this.logger.log(`✅ All webhooks successfully registered for user: ${userId}`);
      } catch (error: any) {
        console.error(`❌ Failed to register webhooks for user ${userId}:`, error);
        this.logger.error(`❌ Failed to register webhooks for user ${userId}:`, error.message);
        this.logger.error('Webhook registration error details:', error);
        // Don't throw - connection can still succeed even if webhook registration fails
        // User can manually trigger webhook registration later if needed
      }

      return {
        success: true,
        message: 'Jobber account connected successfully',
      };
    } catch (error: any) {
      this.logger.error('Error handling Jobber OAuth callback:', error);
      throw new Error(
        error.response?.data?.error_description || 'Failed to connect Jobber account',
      );
    }
  }

  async refreshAccessToken(userId: string): Promise<string> {
    console.log(`🔄 Refreshing access token for user: ${userId}`);
    this.logger.log(`Attempting to refresh access token for user: ${userId}`);
    
    const user = await this.authService.getUserById(userId);
    
    if (!user?.jobberRefreshToken) {
      this.logger.warn(`No refresh token found for user ${userId}`);
      throw new UnauthorizedException('No refresh token available. Please reconnect your Jobber account.');
    }

    try {
      this.logger.log(`Using refresh token (length: ${user.jobberRefreshToken.length}) for refresh request`);
      const response = await axios.post(
        'https://api.getjobber.com/api/oauth/token',
        {
          grant_type: 'refresh_token',
          refresh_token: user.jobberRefreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = expires_in
        ? new Date(Date.now() + expires_in * 1000)
        : new Date(Date.now() + 3600 * 1000);

      console.log('✅ Access token refreshed successfully');
      this.logger.log('✅ Access token refreshed successfully');

      // Update tokens in database
      // Always use the new refresh token if provided, otherwise keep the existing one
      const newRefreshToken = refresh_token || user.jobberRefreshToken;
      this.logger.log(`Updating tokens - new refresh token: ${newRefreshToken ? 'Provided' : 'Using existing'}`);
      
      await this.authService.updateJobberToken(
        userId,
        access_token,
        user.jobberAccountId || '',
        newRefreshToken, // Use new refresh token if provided, else keep old one
        expiresAt,
      );

      this.logger.log('✅ Tokens updated in database after refresh');
      return access_token;
    } catch (error: any) {
      this.logger.error('❌ Error refreshing access token:', error);
      const errorMessage = error.response?.data?.error_description || error.response?.data || error.message;
      this.logger.error('Refresh token error details:', errorMessage);
      
      // Check if the error is due to invalid refresh token
      const isInvalidToken = 
        errorMessage?.includes('refresh token is not valid') ||
        errorMessage?.includes('invalid refresh token') ||
        errorMessage?.includes('refresh_token') ||
        error.response?.status === 401;

      if (isInvalidToken) {
        this.logger.error('🚨 Invalid refresh token detected. Clearing all Jobber tokens for user.');
        // Automatically clear invalid tokens
        try {
          await this.authService.disconnectJobber(userId);
          this.logger.log('✅ Cleared invalid tokens from database');
        } catch (clearError) {
          this.logger.error('Failed to clear invalid tokens:', clearError);
        }
      }

      throw new UnauthorizedException(
        'Failed to refresh access token. Please disconnect and reconnect your Jobber account in Settings.',
      );
    }
  }

  async getValidAccessToken(userId: string): Promise<string> {
    const user = await this.authService.getUserById(userId);
    
    if (!user?.jobberAccessToken) {
      throw new UnauthorizedException('No Jobber access token found. Please connect your Jobber account.');
    }

    // Check if token is expired or about to expire (5 minute buffer)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    
    if (!user.jobberTokenExpiresAt || user.jobberTokenExpiresAt < fiveMinutesFromNow) {
      console.log('⏰ Access token expired or about to expire, refreshing...');
      return await this.refreshAccessToken(userId);
    }
    
    return user.jobberAccessToken;
  }

  async disconnect(userId: string): Promise<{ success: boolean }> {
    this.logger.log(`🔌 Disconnecting Jobber for user: ${userId}`);
    
    // Get user to check if they have tokens
    const user = await this.authService.getUserById(userId);
    
    if (!user?.jobberAccessToken) {
      this.logger.log('⚠️ No Jobber tokens found, clearing any remaining data...');
      await this.authService.disconnectJobber(userId);
      return { success: true };
    }

    // Best-effort: call Jobber appDisconnect if we have a valid token.
    try {
      this.logger.log('📡 Attempting to notify Jobber of disconnect...');
      const accessToken = await this.getValidAccessToken(userId);
      await axios.post(
        'https://api.getjobber.com/api/graphql',
        {
          query: `
            mutation AppDisconnect {
              appDisconnect(input: {}) {
                success
                userErrors {
                  message
                }
              }
            }
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-JOBBER-GRAPHQL-VERSION': '2025-04-16',
          },
        },
      );
      this.logger.log('✅ Jobber notified of disconnect');
    } catch (error: any) {
      // ignore - we still clear local tokens even if API call fails
      this.logger.warn(`⚠️ Jobber appDisconnect API call failed (continuing local disconnect): ${error?.message}`);
      this.logger.warn('This is normal if tokens are already invalid. Proceeding with local cleanup...');
    }

    // Always clear local tokens regardless of API call success
    this.logger.log('🧹 Clearing local Jobber tokens and account data...');
    await this.authService.disconnectJobber(userId);
    this.logger.log('✅ Local Jobber data cleared successfully');
    
    return { success: true };
  }
}
