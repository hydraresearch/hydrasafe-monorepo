import { Request, Response } from 'express';
import Content, { IContent } from '../models/Content';

// @desc    Create new content
// @route   POST /api/content
// @access  Private
export const createContent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { title, content, contentType, tags, metaTitle, metaDescription, featuredImage, status } = req.body;

    const newContent = await Content.create({
      title,
      content,
      contentType,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      metaTitle,
      metaDescription,
      featuredImage,
      status,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: newContent,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
};

// @desc    Get all content with pagination and filtering
// @route   GET /api/content
// @access  Private
export const getAllContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;
    
    // Build query based on filters
    const query: any = {};
    
    if (req.query.contentType) {
      query.contentType = req.query.contentType;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.tag) {
      query.tags = { $in: [req.query.tag] };
    }
    
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Count total documents
    const total = await Content.countDocuments(query);
    
    // Find content with pagination
    const contents = await Content.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
      
    res.status(200).json({
      success: true,
      count: contents.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: contents,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
};

// @desc    Get content by ID
// @route   GET /api/content/:id
// @access  Private
export const getContentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const content = await Content.findById(req.params.id).populate('author', 'name email');
    
    if (!content) {
      res.status(404).json({ success: false, message: 'Content not found' });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
};

// @desc    Get content by slug
// @route   GET /api/content/slug/:slug
// @access  Private
export const getContentBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const content = await Content.findOne({ slug: req.params.slug }).populate('author', 'name email');
    
    if (!content) {
      res.status(404).json({ success: false, message: 'Content not found' });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
};

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private
export const updateContent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }
    
    let content = await Content.findById(req.params.id);
    
    if (!content) {
      res.status(404).json({ success: false, message: 'Content not found' });
      return;
    }
    
    // Check if user is author or admin
    if (content.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to update this content' });
      return;
    }

    const { title, content: contentBody, contentType, tags, metaTitle, metaDescription, featuredImage, status } = req.body;
    
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content: contentBody,
        contentType,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        metaTitle,
        metaDescription,
        featuredImage,
        status,
      },
      { new: true, runValidators: true }
    ).populate('author', 'name email');
    
    res.status(200).json({
      success: true,
      data: updatedContent,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private
export const deleteContent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }
    
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      res.status(404).json({ success: false, message: 'Content not found' });
      return;
    }
    
    // Check if user is author or admin
    if (content.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to delete this content' });
      return;
    }
    
    await Content.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
};