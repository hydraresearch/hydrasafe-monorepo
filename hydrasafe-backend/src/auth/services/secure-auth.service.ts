import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { UserRepository } from '../repositories/user.repository';
import { ConfigService } from '@nestjs/config';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class SecureAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService
  ) {}

  /**
   * Enhanced login with multi-factor authentication
   */
  async login(email: string, password: string): Promise<AuthTokens | null> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Constant-time password comparison to prevent timing attacks
    const isPasswordValid = await this.comparePassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      // Require 2FA verification before generating tokens
      return null; // Indicate 2FA challenge needed
    }

    return this.generateAuthTokens(user);
  }

  /**
   * Verify Two-Factor Authentication
   */
  async verifyTwoFactor(userId: string, token: string): Promise<AuthTokens> {
    const user = await this.userRepository.findById(userId);
    
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('Two-factor authentication not configured');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid two-factor token');
    }

    return this.generateAuthTokens(user);
  }

  /**
   * Generate secure authentication tokens
   */
  private async generateAuthTokens(user: any): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user)
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Generate access token with short expiration
   */
  private async generateAccessToken(user: any): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m', // Short-lived access token
      algorithm: 'RS256'
    });
  }

  /**
   * Generate refresh token with longer expiration
   */
  private async generateRefreshToken(user: any): Promise<string> {
    const payload = {
      sub: user.id,
      tokenVersion: user.tokenVersion
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      expiresIn: '7d',
      algorithm: 'RS256'
    });
  }

  /**
   * Secure password comparison with constant-time algorithm
   */
  private async comparePassword(
    plainTextPassword: string, 
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  /**
   * Setup Two-Factor Authentication
   */
  async setupTwoFactor(userId: string): Promise<{ secret: string, qrCode: string }> {
    const user = await this.userRepository.findById(userId);
    
    const secret = speakeasy.generateSecret({ 
      name: `HydraSafe:${user.email}` 
    });

    // Store secret securely
    await this.userRepository.updateTwoFactorSecret(userId, secret.base32);

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url
    };
  }

  /**
   * Invalidate all tokens for a user
   */
  async invalidateAllTokens(userId: string): Promise<void> {
    await this.userRepository.incrementTokenVersion(userId);
  }

  /**
   * Reset user password with additional security checks
   */
  async resetPassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<boolean> {
    const user = await this.userRepository.findById(userId);

    // Verify current password
    const isCurrentPasswordValid = await this.comparePassword(
      currentPassword, 
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Prevent password reuse
    const isNewPasswordDifferent = 
      !(await this.comparePassword(newPassword, user.passwordHash));

    if (!isNewPasswordDifferent) {
      throw new Error('New password must be different from the current password');
    }

    // Hash new password
    const saltRounds = 12; // Increased from typical 10 for extra security
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and invalidate all existing tokens
    await Promise.all([
      this.userRepository.updatePassword(userId, newPasswordHash),
      this.invalidateAllTokens(userId)
    ]);

    return true;
  }
}

export default SecureAuthService;
