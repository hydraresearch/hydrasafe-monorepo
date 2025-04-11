import { Controller, Post, Body, UseGuards, Get, HttpCode, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from './decorators/user.decorator';

class WalletAuthDto {
  walletAddress: string;
  signature: string;
  message: string;
}

class LoginDto {
  email: string;
  password: string;
}

class RegisterDto {
  email: string;
  password: string;
}

class VerifyTokenDto {
  token: string;
}

class LinkWalletDto {
  walletAddress: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('wallet')
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate with wallet signature' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async authenticateWithWallet(@Body(ValidationPipe) credentials: WalletAuthDto) {
    return this.authService.authenticateWithWallet(credentials);
  }

  @Post('link-wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link wallet to user account' })
  @ApiResponse({ status: 200, description: 'Wallet linked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Wallet already linked to another account' })
  async linkWallet(@User() user: any, @Body(ValidationPipe) linkWalletDto: LinkWalletDto) {
    return {
      success: await this.authService.linkWalletToUser(user.sub, linkWalletDto.walletAddress),
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@User() user: any) {
    return this.authService.findUserById(user.sub);
  }

  @Post('verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify JWT token' })
  @ApiResponse({ status: 200, description: 'Token verification result' })
  async verifyToken(@Body(ValidationPipe) verifyTokenDto: VerifyTokenDto) {
    return this.authService.verifyToken(verifyTokenDto.token);
  }
}
