/**
 * Copyright (c) 2025 Hydra Research
 * Author: Nicolas Cloutier
 * GitHub: nicksdigital
 * 
 * HydraSafe Backend - Authentication Service
 * 
 * This service handles user authentication and authorization.
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../../utils/logger';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { SecurityService } from '../security/security.service';

@Injectable()
export class AuthService {
  private readonly logger: Logger;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly securityService: SecurityService,
  ) {
    this.logger = new Logger('AuthService');
  }

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userService.findOneByUsername(username);
    if (!user) {
      throw new NotFoundException(`User ${username} not found`);
    }

    const isValidPassword = await this.securityService.verifyPassword(
      password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(credentials: AuthCredentialsDto): Promise<{ access_token: string }> {
    const user = await this.validateUser(credentials.username, credentials.password);
    const payload: JwtPayload = { username: user.username, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(credentials: AuthCredentialsDto): Promise<User> {
    const existingUser = await this.userService.findOneByUsername(credentials.username);
    if (existingUser) {
      throw new ConflictException(`Username ${credentials.username} already exists`);
    }

    const hashedPassword = await this.securityService.hashPassword(credentials.password);
    return this.userService.create({
      username: credentials.username,
      password: hashedPassword,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const isValidPassword = await this.securityService.verifyPassword(
      currentPassword,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid current password');
    }

    const hashedNewPassword = await this.securityService.hashPassword(newPassword);
    await this.userService.updatePassword(userId, hashedNewPassword);
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const hashedPassword = await this.securityService.hashPassword(newPassword);
    await this.userService.updatePassword(userId, hashedPassword);
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshToken(token: string): Promise<{ access_token: string }> {
    const payload = await this.verifyToken(token);
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
