import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { IWallet } from '@hydrasafe/common/dist/models/wallet';
import { logger } from '../utils/logger';

interface SecurityContext {
  viseLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sessionStart: Date;
  lastActivity: Date;
}

// Module augmentation for Express Request
import '@types/express';

declare module 'express' {
  interface Request {
    user?: {
      address: string;
      roles: string[];
    };
    securityContext?: SecurityContext;
    wallet?: IWallet;
  }
}

export const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip auth for public routes
    if (req.path.startsWith('/api/auth')) {
      return next();
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT and extract user info
    const user = await verifyToken(token);
    req.user = user;

    // Initialize security context
    const securityContext: SecurityContext = {
      viseLevel: determineViseLevel(req),
      sessionStart: new Date(),
      lastActivity: new Date(),
    };
    req.securityContext = securityContext;

    // Log security-relevant information
    logger.info('Security context initialized', {
      user: user.address,
      viseLevel: securityContext.viseLevel,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    next();
  } catch (error) {
    logger.error('Security middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

function determineViseLevel(req: Request): SecurityContext['viseLevel'] {
  // Determine VISE security level based on:
  // 1. Request path/method
  // 2. User roles
  // 3. Transaction value (if applicable)
  // 4. Historical context

  const highRiskPaths = [
    '/api/transaction/create',
    '/api/wallet/recovery',
    '/api/wallet/update-security',
  ];

  if (highRiskPaths.includes(req.path)) {
    return 'CRITICAL';
  }

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    return 'HIGH';
  }

  if (req.user?.roles.includes('ADMIN')) {
    return 'MEDIUM';
  }

  return 'LOW';
}

// Middleware to enforce VISE level requirements
export const requireViseLevel = (level: SecurityContext['viseLevel']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentLevel = req.securityContext?.viseLevel;

    if (!currentLevel) {
      return res.status(500).json({ error: 'No security context' });
    }

    const levels: Record<SecurityContext['viseLevel'], number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };

    if (levels[currentLevel] < levels[level]) {
      return res.status(403).json({
        error: 'Insufficient security level',
        required: level,
        current: currentLevel,
      });
    }

    next();
  };
};
