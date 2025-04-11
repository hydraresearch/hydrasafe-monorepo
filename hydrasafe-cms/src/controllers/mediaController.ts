import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import Media, { IMedia } from '../models/Media';

// @desc    Upload media file
// @route   POST /api/media
// @access  Private
export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Please upload a file' });
      return;
    }

    // Create media record
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    const media = await Media.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: fileUrl,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: media,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
};

// @desc    Get all media with pagination
// @route   GET /api/media
// @access  Private
export const getAllMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startIndex = (page - 1) * limit;

    // Build filter query
    const query: any = {};
    
    if (req.query.mimeType) {
      query.mimeType = { $regex: req.query.mimeType, $options: 'i' };
    }

    if (req.query.search) {
      query.$or = [
        { originalName: { $regex: req.query.search, $options: 'i' } },
        { alt: { $regex: req.query.search, $options: 'i' } },
        { caption: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Count total documents
    const total = await Media.countDocuments(query);
    
    // Find media with pagination
    const media = await Media.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
      
    res.status(200).json({
      success: true,
      count: media.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: media,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
};

// @desc    Get media by ID
// @route   GET /api/media/:id
// @access  Private
export const getMediaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const media = await Media.findById(req.params.id).populate('uploadedBy', 'name email');
    
    if (!media) {
      res.status(404).json({ success: false, message: 'Media not found' });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
};

// @desc    Update media metadata
// @route   PUT /api/media/:id
// @access  Private
export const updateMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }
    
    const { alt, caption } = req.body;
    
    let media = await Media.findById(req.params.id);
    
    if (!media) {
      res.status(404).json({ success: false, message: 'Media not found' });
      return;
    }
    
    // Check if user is uploader or admin
    if (media.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to update this media' });
      return;
    }
    
    media = await Media.findByIdAndUpdate(
      req.params.id,
      { alt, caption },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');
    
    res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
};

// @desc    Delete media
// @route   DELETE /api/media/:id
// @access  Private
export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }
    
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      res.status(404).json({ success: false, message: 'Media not found' });
      return;
    }
    
    // Check if user is uploader or admin
    if (media.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to delete this media' });
      return;
    }
    
    // Delete file from filesystem
    fs.unlink(media.path, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      }
    });
    
    // Delete from database
    await Media.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
};