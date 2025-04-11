import { Request, Response } from 'express';
import Content from '../models/Content';
import Media from '../models/Media';
import User from '../models/User';
import ApiKey from '../models/ApiKey';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get content count
    const contentCount = await Content.countDocuments();
    
    // Get media count
    const mediaCount = await Media.countDocuments();
    
    // Get user count (admins only)
    const userCount = req.user?.role === 'admin' 
      ? await User.countDocuments() 
      : 0;
    
    // Get API key count
    const apiKeyFilter = req.user?.role === 'admin' 
      ? {} 
      : { createdBy: req.user?._id };
    
    const apiKeyCount = await ApiKey.countDocuments(apiKeyFilter);
    
    // Get recent content (last 5 items)
    const contentFilter = req.user?.role === 'admin' 
      ? {} 
      : { author: req.user?._id };
    
    const recentContent = await Content.find(contentFilter)
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title contentType status slug updatedAt');
    
    // Return stats
    res.status(200).json({
      success: true,
      stats: {
        contentCount,
        mediaCount,
        userCount,
        apiKeyCount,
        recentContent,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};