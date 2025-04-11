import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// Validation schemas using Zod
export const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'USER']),
  walletAddresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).optional(),
  securityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  isActive: z.boolean(),
  lastLogin: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// MongoDB schema
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'USER'],
    default: 'USER'
  },
  walletAddresses: [{
    type: String,
    validate: {
      validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
      message: 'Invalid Ethereum address format'
    }
  }],
  securityLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'walletAddresses': 1 });

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
  walletAddresses?: string[];
  securityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const User = mongoose.model<IUser>('User', userSchema);
