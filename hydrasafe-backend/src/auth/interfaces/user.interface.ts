import { Document } from 'mongoose';

export interface LoginAttempt {
  timestamp: Date;
  isSuccessful: boolean;
  ipAddress: string;
}

export interface User extends Document {
  email: string;
  passwordHash: string;
  role: string;
  tokenVersion: number;
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string;
  isLocked: boolean;
  lockedUntil?: Date;
  lastPasswordChangeAt?: Date;
  loginAttempts: LoginAttempt[];
}

export interface CreateUserDto {
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserDto {
  email?: string;
  role?: string;
  isTwoFactorEnabled?: boolean;
}
