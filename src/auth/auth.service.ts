import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async getSubscriptionSummary(userId: string) {
    const subscription = await this.prisma.stripeSubscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing', 'past_due'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      isSubscribed: !!subscription,
      subscription: subscription
        ? { planKey: subscription.planKey, status: subscription.status }
        : null,
    };
  }

  async signUp(signUpDto: SignUpDto) {
    const { email, password, name } = signUpDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique publicFormKey
    let publicFormKey: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      publicFormKey = crypto.randomBytes(16).toString('hex');
      
      // Check if key already exists
      const existing = await this.prisma.user.findUnique({
        where: { publicFormKey },
      });

      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique publicFormKey after multiple attempts');
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        publicFormKey: publicFormKey!,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user,
    };
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    const subscriptionSummary = await this.getSubscriptionSummary(user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        ...subscriptionSummary,
      },
    };
  }

  async updateJobberToken(
    userId: string,
    accessToken: string,
    accountId: string,
    refreshToken?: string,
    expiresAt?: Date,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        jobberAccessToken: accessToken,
        jobberAccountId: accountId,
        jobberRefreshToken: refreshToken,
        jobberTokenExpiresAt: expiresAt,
      },
    });
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        jobberAccessToken: true,
        jobberRefreshToken: true,
        jobberTokenExpiresAt: true,
        jobberAccountId: true,
        createdAt: true,
      },
    });
    if (!user) {
      return null;
    }

    const subscriptionSummary = await this.getSubscriptionSummary(userId);

    return {
      ...user,
      ...subscriptionSummary,
    };
  }

  async getUserByAccountId(accountId: string) {
    return this.prisma.user.findFirst({
      where: { jobberAccountId: accountId },
      select: {
        id: true,
        email: true,
        name: true,
        jobberAccessToken: true,
        jobberRefreshToken: true,
        jobberTokenExpiresAt: true,
        jobberAccountId: true,
      },
    });
  }

  /**
   * If we can't find a user by accountId, but there is exactly one user who has a Jobber token
   * and is missing accountId, attach this accountId to that user. This helps recover from older
   * connections where accountId wasn't saved.
   */
  async getUserByAccountIdOrAttach(accountId: string) {
    const existing = await this.getUserByAccountId(accountId);
    if (existing?.id) return existing;

    const candidates = await this.prisma.user.findMany({
      where: {
        jobberAccessToken: { not: null },
        jobberAccountId: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        jobberAccessToken: true,
        jobberRefreshToken: true,
        jobberTokenExpiresAt: true,
        jobberAccountId: true,
      },
      take: 2,
    });

    if (candidates.length === 1) {
      return this.prisma.user.update({
        where: { id: candidates[0].id },
        data: { jobberAccountId: accountId },
        select: {
          id: true,
          email: true,
          name: true,
          jobberAccessToken: true,
          jobberRefreshToken: true,
          jobberTokenExpiresAt: true,
          jobberAccountId: true,
        },
      });
    }

    return null;
  }

  async disconnectJobber(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        jobberAccessToken: null,
        jobberRefreshToken: null,
        jobberTokenExpiresAt: null,
        jobberAccountId: null,
      },
    });
  }
}
