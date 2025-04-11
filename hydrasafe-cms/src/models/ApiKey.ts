import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IApiKey extends Document {
  name: string;
  key: string;
  createdBy: mongoose.Types.ObjectId;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name for this API key'],
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUsed: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate a unique API key before saving
apiKeySchema.pre('save', function (next) {
  if (!this.isModified('key')) {
    return next();
  }
  
  // Generate a random key
  const buffer = crypto.randomBytes(32);
  this.key = buffer.toString('hex');
  
  next();
});

const ApiKey = mongoose.model<IApiKey>('ApiKey', apiKeySchema);

export default ApiKey;