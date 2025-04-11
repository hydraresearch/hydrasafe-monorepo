import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

export const TransactionSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  hash: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED']),
  type: z.enum(['TRANSFER', 'CONTRACT_INTERACTION', 'GOVERNANCE', 'RECOVERY']),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  data: z.object({
    to: z.string(),
    value: z.string(),
    data: z.string().optional(),
    gasLimit: z.string().optional(),
    nonce: z.number().optional()
  }),
  approvals: z.array(z.object({
    address: z.string(),
    signature: z.string().optional(),
    timestamp: z.date(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED'])
  })),
  securityContext: z.object({
    viseState: z.string(),
    qzkpProof: z.string().optional(),
    lmvsVector: z.string().optional(),
    timelock: z.date().optional()
  }),
  createdAt: z.date(),
  updatedAt: z.date()
});

const transactionSchema = new Schema({
  walletAddress: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
      message: 'Invalid Ethereum address format'
    }
  },
  hash: String,
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED'],
    required: true
  },
  type: {
    type: String,
    enum: ['TRANSFER', 'CONTRACT_INTERACTION', 'GOVERNANCE', 'RECOVERY'],
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  data: {
    to: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    data: String,
    gasLimit: String,
    nonce: Number
  },
  approvals: [{
    address: {
      type: String,
      required: true
    },
    signature: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      required: true
    }
  }],
  securityContext: {
    viseState: {
      type: String,
      required: true
    },
    qzkpProof: String,
    lmvsVector: String,
    timelock: Date
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ walletAddress: 1 });
transactionSchema.index({ hash: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ riskLevel: 1 });
transactionSchema.index({ createdAt: 1 });

export interface ITransaction extends Document {
  walletAddress: string;
  hash?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED';
  type: 'TRANSFER' | 'CONTRACT_INTERACTION' | 'GOVERNANCE' | 'RECOVERY';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data: {
    to: string;
    value: string;
    data?: string;
    gasLimit?: string;
    nonce?: number;
  };
  approvals: Array<{
    address: string;
    signature?: string;
    timestamp: Date;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }>;
  securityContext: {
    viseState: string;
    qzkpProof?: string;
    lmvsVector?: string;
    timelock?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
