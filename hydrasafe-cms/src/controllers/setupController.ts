import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

/**
 * @desc    Check setup status
 * @route   GET /api/setup/status
 * @access  Public
 */
export const checkSetupStatus = async (req: Request, res: Response) => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    // Check if system config exists
    const configPath = path.join(__dirname, '../../config/system.json');
    const configExists = fs.existsSync(configPath);
    
    res.status(200).json({
      success: true,
      setupRequired: !adminExists || !configExists,
      adminSetup: !!adminExists,
      systemSetup: !!configExists
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Create admin user
 * @route   POST /api/setup/admin
 * @access  Public
 */
export const setupAdmin = async (req: Request, res: Response) => {
  try {
    // Check if any admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Setup already completed. Admin user already exists.'
      });
    }
    
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }
    
    // Create admin user
    const user = await User.create({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: 'admin',
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Setup system settings
 * @route   POST /api/setup/system
 * @access  Public
 */
export const setupSystem = async (req: Request, res: Response) => {
  try {
    // Check if system config already exists
    const configPath = path.join(__dirname, '../../config/system.json');
    const configExists = fs.existsSync(configPath);
    
    if (configExists) {
      return res.status(400).json({
        success: false,
        message: 'Setup already completed. System settings already exist.'
      });
    }
    
    const { siteName, siteUrl, apiUrl, allowRegistration } = req.body;
    
    // Validate input
    if (!siteName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a site name'
      });
    }
    
    // Create system config
    const configDir = path.join(__dirname, '../../config');
    
    // Create config directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const systemConfig = {
      siteName,
      siteUrl: siteUrl || '',
      apiUrl: apiUrl || process.env.API_URL || 'http://localhost:5000',
      allowRegistration: allowRegistration || false,
      setupCompleted: true,
      setupDate: new Date().toISOString()
    };
    
    fs.writeFileSync(configPath, JSON.stringify(systemConfig, null, 2));
    
    res.status(200).json({
      success: true,
      message: 'System setup completed successfully',
      config: systemConfig
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
