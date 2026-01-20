import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    const method = request.method;
    
    this.logger.log(`🔐 JWT Guard checking: ${method} ${url}`);
    
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn(`❌ No token provided for ${method} ${url}`);
      throw new UnauthorizedException('No token provided');
    }

    this.logger.log(`✅ Token found, length: ${token.length}, starting with: ${token.substring(0, 20)}...`);

    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        this.logger.error('❌ JWT_SECRET is not configured!');
        throw new UnauthorizedException('JWT secret not configured');
      }

      const payload = this.jwtService.verify(token, {
        secret: jwtSecret,
      });
      
      this.logger.log(`✅ Token verified successfully. User ID: ${payload.sub}, Email: ${payload.email}`);
      request.user = { userId: payload.sub, email: payload.email };
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Token verification failed for ${method} ${url}:`, error.message);
      this.logger.error(`Error name: ${error.name}, Error message: ${error.message}`);
      
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token format');
      } else if (error.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active yet');
      }
      
      throw new UnauthorizedException(`Invalid token: ${error.message}`);
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      this.logger.warn('No Authorization header found');
      return undefined;
    }
    
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer') {
      this.logger.warn(`Invalid auth type: ${type}, expected Bearer`);
      return undefined;
    }
    
    return token;
  }
}
