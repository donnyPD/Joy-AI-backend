import { Controller, Get, Post, Query, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JobberOAuthService } from './jobber-oauth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth/jobber')
export class JobberOAuthController {
  constructor(private jobberOAuthService: JobberOAuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('oauth-url')
  getOAuthUrl(@Request() req: any) {
    console.log('🔗 GET OAUTH URL API CALLED');
    console.log('User ID:', req.user.userId);
    console.log('User Email:', req.user.email);
    const result = this.jobberOAuthService.getOAuthUrl(req.user.userId);
    console.log('OAuth URL generated:', result.authUrl);
    return result;
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    console.log('🔄 JOBBER OAUTH CALLBACK API CALLED');
    console.log('Authorization code received:', code ? 'Yes' : 'No');
    console.log('State received:', state ? 'Yes' : 'No');
    
    try {
      await this.jobberOAuthService.handleCallback(code, state);
      console.log('✅ OAuth callback processed successfully');

      // Redirect to frontend with success message
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      console.log('Redirecting to:', `${frontendUrl}/dashboard?connected=true`);
      res.redirect(`${frontendUrl}/dashboard?connected=true`);
    } catch (error: any) {
      console.error('❌ OAuth callback error:', error.message);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/dashboard?error=${encodeURIComponent(error.message)}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('disconnect')
  async disconnect(@Request() req: any) {
    return this.jobberOAuthService.disconnect(req.user.userId);
  }
}
