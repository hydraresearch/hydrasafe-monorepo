import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../interfaces/user.interface';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId).exec();
  }

  async updateTwoFactorSecret(
    userId: string, 
    twoFactorSecret: string
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { 
      twoFactorSecret,
      isTwoFactorEnabled: true 
    }).exec();
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { tokenVersion: 1 }
    }).exec();
  }

  async updatePassword(
    userId: string, 
    newPasswordHash: string
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      passwordHash: newPasswordHash,
      lastPasswordChangeAt: new Date()
    }).exec();
  }

  // Additional security-related methods
  async logLoginAttempt(
    userId: string, 
    isSuccessful: boolean, 
    ipAddress: string
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $push: {
        loginAttempts: {
          timestamp: new Date(),
          isSuccessful,
          ipAddress
        }
      }
    }).exec();
  }

  async lockAccount(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isLocked: true,
      lockedUntil: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    }).exec();
  }
}

export default UserRepository;
