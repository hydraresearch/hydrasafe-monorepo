import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

export interface IContent extends Document {
  title: string;
  slug: string;
  content: string;
  contentType: 'page' | 'post' | 'product';
  status: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  author: mongoose.Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contentSchema = new Schema<IContent>(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
    },
    contentType: {
      type: String,
      enum: ['page', 'post', 'product'],
      default: 'page',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    featuredImage: {
      type: String,
    },
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot be more than 60 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot be more than 160 characters'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from title
contentSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true });
  }
  
  // Set publishedAt date when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

const Content = mongoose.model<IContent>('Content', contentSchema);

export default Content;