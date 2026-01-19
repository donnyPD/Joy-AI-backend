import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { JobberOAuthService } from './jobber/jobber-oauth.service';
import { JobberOAuthController } from './jobber/jobber-oauth.controller';
import { JobberModule } from '../jobber/jobber.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    JobberModule,
  ],
  controllers: [AuthController, JobberOAuthController],
  providers: [AuthService, JwtStrategy, JobberOAuthService],
  exports: [AuthService, JobberOAuthService],
})
export class AuthModule {}
