/**
 * Copyright (c) 2025 Hydra Research
 * Author: Nicolas Cloutier
 * GitHub: nicksdigital
 *
 * HydraSafe Backend - Security Middleware
 *
 * This middleware provides security-related functionality for the HydraSafe backend.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../utils/logger';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // CSP (Content Security Policy)
    const csp = [
      "default-src 'self';",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
      "style-src 'self' 'unsafe-inline';",
      "img-src 'self' data: https:;",
      "connect-src 'self' https: wss:;",
      "font-src 'self';",
      "object-src 'none';",
      "media-src 'self';",
      "frame-src 'none';",
      "child-src 'none';",
      "form-action 'self';",
      "base-uri 'self';",
      "manifest-src 'self';",
    ].join(' ');

    res.setHeader('Content-Security-Policy', csp);

    // HSTS (HTTP Strict Transport Security)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    next();
  }
}

export const securityMiddlewareFactory = () => {
  return new SecurityMiddleware(new Logger());
};
