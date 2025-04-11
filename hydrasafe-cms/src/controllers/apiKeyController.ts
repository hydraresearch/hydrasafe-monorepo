import { Request, Response } from 'express';
import ApiKey from '../models/ApiKey';

/**
 * @desc    Create a new API key
 * @route   POST /api/api-keys
 * @access  Private (Admin, Editor)
 */
export const createApiKey = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a name for the API key',
      });
    }

    const apiKey = new ApiKey({
      name,
      key: 'temp', // Will be generated via pre-save hook
      createdBy: req.user?._id,
    });

    await apiKey.save();

    res.status(201).json({
      success: true,
      apiKey,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get all API keys
 * @route   GET /api/api-keys
 * @access  Private (Admin, Editor)
 */
export const getAllApiKeys = async (req: Request, res: Response) => {
  try {
    // For non-admins, only show their own API keys
    const filter = req.user?.role === 'admin' ? {} : { createdBy: req.user?._id };

    const apiKeys = await ApiKey.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: apiKeys.length,
      apiKeys,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get API key by ID
 * @route   GET /api/api-keys/:id
 * @access  Private (Admin, Editor)
 */
export const getApiKeyById = async (req: Request, res: Response) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found',
      });
    }

    // Check if user has permission
    if (req.user?.role !== 'admin' && 
       apiKey.createdBy.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this API key',
      });
    }

    res.status(200).json({
      success: true,
      apiKey,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete API key
 * @route   DELETE /api/api-keys/:id
 * @access  Private (Admin, Editor)
 */
export const deleteApiKey = async (req: Request, res: Response) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found',
      });
    }

    // Check if user has permission
    if (req.user?.role !== 'admin' && 
       apiKey.createdBy.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this API key',
      });
    }

    await apiKey.deleteOne();

    res.status(200).json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};