import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// Validation schemas using Zod
export const WalletSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  identityHash: z.string(),
  securityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  isLocked: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tenants: z.array(z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    role: z.enum(['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']),
    permissions: z.array(z.string()),
    addedAt: z.date(),
    lastAccessAt: z.date().optional()
  })),
  securityContext: z.object({
    viseLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    sessionTimeout: z.number(),
    lastActivity: z.date(),
    requiredApprovals: z.number(),
    recoveryKeys: z.array(z.string()).optional()
  })
});

// MongoDB schema
const walletSchema = new Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
      message: 'Invalid Ethereum address format'
    }
  },
  identityHash: {
    type: String,
    required: true,
    unique: true
  },
  securityLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  tenants: [{
    address: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
        message: 'Invalid Ethereum address format'
      }
    },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER'],
      required: true
    },
    permissions: [String],
    addedAt: {
      type: Date,
      default: Date.now
    },
    lastAccessAt: Date
  }],
  securityContext: {
    viseLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true
    },
    sessionTimeout: {
      type: Number,
      required: true
    },
    lastActivity: {
      type: Date,
      required: true
    },
    requiredApprovals: {
      type: Number,
      required: true
    },
    recoveryKeys: [String]
  }
}, {
  timestamps: true
});

// Indexes
walletSchema.index({ address: 1 });
walletSchema.index({ identityHash: 1 });
walletSchema.index({ 'tenants.address': 1 });
walletSchema.index({ securityLevel: 1 });

export interface IWallet extends Document {
  address: string;
  identityHash: string;
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isLocked: boolean;
  tenants: Array<{
    address: string;
    role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
    permissions: string[];
    addedAt: Date;
    lastAccessAt?: Date;
  }>;
  securityContext: {
    viseLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    sessionTimeout: number;
    lastActivity: Date;
    requiredApprovals: number;
    recoveryKeys?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);
