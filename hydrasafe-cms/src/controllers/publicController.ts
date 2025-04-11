import { Request, Response } from 'express';
import Content from '../models/Content';

/**
 * @desc    Get all published content
 * @route   GET /public-api/content
 * @access  Public (with API key)
 */
export const getPublishedContent = async (req: Request, res: Response) => {
  try {
    const content = await Content.find({ status: 'published' })
      .select('-__v')
      .populate('author', 'name')
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      count: content.length,
      data: content,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get published content by ID
 * @route   GET /public-api/content/:id
 * @access  Public (with API key)
 */
export const getPublishedContentById = async (req: Request, res: Response) => {
  try {
    const content = await Content.findOne({
      _id: req.params.id,
      status: 'published',
    })
      .select('-__v')
      .populate('author', 'name');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found or not published',
      });
    }

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get published content by slug
 * @route   GET /public-api/content/slug/:slug
 * @access  Public (with API key)
 */
export const getPublishedContentBySlug = async (req: Request, res: Response) => {
  try {
    const content = await Content.findOne({
      slug: req.params.slug,
      status: 'published',
    })
      .select('-__v')
      .populate('author', 'name');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found or not published',
      });
    }

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get published content by type
 * @route   GET /public-api/content/type/:type
 * @access  Public (with API key)
 */
export const getPublishedContentByType = async (req: Request, res: Response) => {
  try {
    const content = await Content.find({
      contentType: req.params.type,
      status: 'published',
    })
      .select('-__v')
      .populate('author', 'name')
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      count: content.length,
      data: content,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};