import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TeamMemberTypesService } from '../team-member-types/team-member-types/team-member-types.service';
import { TeamMemberStatusesService } from '../team-member-statuses/team-member-statuses/team-member-statuses.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private teamMemberTypesService: TeamMemberTypesService,
    private teamMemberStatusesService: TeamMemberStatusesService,
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

  /**
   * Creates default TeamMemberTypes and TeamMemberStatuses for a new user.
   * Only creates records that don't already exist.
   */
  private async createDefaultTeamMemberOptions(userId: string): Promise<void> {
    try {
      // Default TeamMemberTypes
      const defaultTypes = ['W2', '1099'];
      for (const typeName of defaultTypes) {
        try {
          // Check if type already exists
          const existing = await this.prisma.teamMemberType.findFirst({
            where: { name: typeName, createdById: userId },
          });

          if (!existing) {
            await this.teamMemberTypesService.create(
              { name: typeName, isActive: true } as any,
              userId,
            );
            this.logger.log(`Created default team member type: ${typeName} for user: ${userId}`);
          } else {
            this.logger.debug(`Team member type ${typeName} already exists for user: ${userId}`);
          }
        } catch (error) {
          // Handle ConflictException (P2002) - record already exists
          if (error.code === 'P2002' || error instanceof ConflictException) {
            this.logger.debug(`Team member type ${typeName} already exists for user: ${userId}`);
          } else {
            this.logger.error(
              `Error creating team member type ${typeName} for user ${userId}: ${error.message}`,
              error.stack,
            );
          }
        }
      }

      // Default TeamMemberStatuses
      const defaultStatuses = ['Active', 'Dismissed', 'No Longer Working'];
      for (const statusName of defaultStatuses) {
        try {
          // Check if status already exists
          const existing = await this.prisma.teamMemberStatus.findFirst({
            where: { name: statusName, createdById: userId },
          });

          if (!existing) {
            await this.teamMemberStatusesService.create(
              { name: statusName, isActive: true } as any,
              userId,
            );
            this.logger.log(`Created default team member status: ${statusName} for user: ${userId}`);
          } else {
            this.logger.debug(`Team member status ${statusName} already exists for user: ${userId}`);
          }
        } catch (error) {
          // Handle ConflictException (P2002) - record already exists
          if (error.code === 'P2002' || error instanceof ConflictException) {
            this.logger.debug(`Team member status ${statusName} already exists for user: ${userId}`);
          } else {
            this.logger.error(
              `Error creating team member status ${statusName} for user ${userId}: ${error.message}`,
              error.stack,
            );
          }
        }
      }
    } catch (error) {
      // Log error but don't throw - we don't want to fail user creation if default records fail
      this.logger.error(
        `Error creating default team member options for user ${userId}: ${error.message}`,
        error.stack,
      );
    }
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

    // Create default team member types and statuses
    // Wrap in try-catch to ensure user creation succeeds even if default records fail
    try {
      await this.createDefaultTeamMemberOptions(user.id);
    } catch (error) {
      // Log error but don't fail user creation
      this.logger.error(
        `Failed to create default team member options for user ${user.id}: ${error.message}`,
        error.stack,
      );
    }

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
    refreshToken?: string | null,
    expiresAt?: Date,
  ) {
    // Build update data - only include refreshToken if it's explicitly provided
    const updateData: any = {
      jobberAccessToken: accessToken,
      jobberAccountId: accountId,
      jobberTokenExpiresAt: expiresAt,
    };

    // Only update refresh token if explicitly provided (not undefined)
    // If null is passed, it means we want to clear it
    // If undefined is passed, we keep the existing value
    if (refreshToken !== undefined) {
      updateData.jobberRefreshToken = refreshToken;
    }

    // Ensure only one user is linked to a Jobber account at a time.
    // If another user already has this accountId, clear their tokens so webhooks
    // resolve to the most recently connected user.
    return this.prisma.$transaction(async (tx) => {
      if (accountId) {
        await tx.user.updateMany({
          where: {
            jobberAccountId: accountId,
            NOT: { id: userId },
          },
          data: {
            jobberAccessToken: null,
            jobberRefreshToken: null,
            jobberTokenExpiresAt: null,
            jobberAccountId: null,
          },
        });
      }

      return tx.user.update({
        where: { id: userId },
        data: updateData,
      });
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
      orderBy: { updatedAt: 'desc' },
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
