import { Request, Response, NextFunction } from 'express';
import ApiKey from '../models/ApiKey';

// Extend Express Request type to include apiKey
declare global {
  namespace Express {
    interface Request {
      apiKey?: any;
    }
  }
}

/**
 * Middleware to authenticate using API key
 */
export const apiKeyAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required',
      });
    }
    
    // Find the API key in the database
    const key = await ApiKey.findOne({ key: apiKey });
    
    if (!key) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
      });
    }
    
    // Update last used timestamp
    key.lastUsed = new Date();
    await key.save();
    
    // Attach API key to request
    req.apiKey = key;
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during API key authentication',
    });
  }
};