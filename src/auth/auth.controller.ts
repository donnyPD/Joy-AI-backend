import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    console.log('📝 SIGNUP API CALLED');
    console.log('Request body:', JSON.stringify(signUpDto, null, 2));
    const result = await this.authService.signUp(signUpDto);
    console.log('✅ Signup successful for:', signUpDto.email);
    console.log('User ID:', result.user.id);
    return result;
  }

  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
    console.log('🔐 SIGNIN API CALLED');
    console.log('Request body:', JSON.stringify({ email: signInDto.email, password: '***' }, null, 2));
    const result = await this.authService.signIn(signInDto);
    console.log('✅ Signin successful for:', signInDto.email);
    console.log('User ID:', result.user.id);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return this.authService.getUserById(req.user.userId);
  }
}
