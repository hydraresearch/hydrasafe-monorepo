import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SecurityService } from '../security.service';
import { Logger } from '../../../utils/logger';

export enum SecurityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

interface SecurityContext {
  id: string;
  userId: string;
  securityLevel: SecurityLevel;
  sessionStart: Date;
  lastActivity: Date;
}

@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly logger = new Logger(SecurityGuard.name);
  private requiredLevel: SecurityLevel = SecurityLevel.LOW;

  constructor(private readonly securityService: SecurityService) {}

  setRequiredLevel(level: SecurityLevel): SecurityGuard {
    this.requiredLevel = level;
    return this;
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('Security guard: No user found in request');
      throw new UnauthorizedException('Authentication required');
    }

    return this.validateSecurityContext(user.id, request);
  }

  private async validateSecurityContext(userId: string, request: any): Promise<boolean> {
    try {
      // Get the security context from the request or create a new one
      let securityContext = request.securityContext;

      if (!securityContext) {
        this.logger.log(`Creating new security context for user ${userId}`);
        securityContext = await this.securityService.getSecurityContext(userId);
        request.securityContext = securityContext;
      }

      // Check if the security context has expired
      if (this.isContextExpired(securityContext)) {
        this.logger.warn(`Security context expired for user ${userId}`);
        throw new UnauthorizedException('Security session expired');
      }

      // Check if the security level is sufficient
      if (!this.isSecurityLevelSufficient(securityContext.securityLevel)) {
        this.logger.warn(
          `Insufficient security level: ${securityContext.securityLevel}, required: ${this.requiredLevel}`,
        );
        throw new UnauthorizedException(`Higher security level required: ${this.requiredLevel}`);
      }

      // Update last activity
      securityContext.lastActivity = new Date();
      
      return true;
    } catch (error) {
      this.logger.error('Security validation failed', error.stack);
      throw new UnauthorizedException('Security validation failed');
    }
  }

  private isContextExpired(context: SecurityContext): boolean {
    const now = new Date();
    const lastActivity = new Date(context.lastActivity);
    
    // Different timeout periods based on security level
    const timeoutMinutes = {
      [SecurityLevel.LOW]: 60,      // 1 hour
      [SecurityLevel.MEDIUM]: 30,   // 30 minutes
      [SecurityLevel.HIGH]: 15,     // 15 minutes
      [SecurityLevel.CRITICAL]: 5,  // 5 minutes
    };
    
    const timeoutMs = timeoutMinutes[context.securityLevel] * 60 * 1000;
    return now.getTime() - lastActivity.getTime() > timeoutMs;
  }

  private isSecurityLevelSufficient(currentLevel: SecurityLevel): boolean {
    const levels = Object.values(SecurityLevel);
    const currentIndex = levels.indexOf(currentLevel);
    const requiredIndex = levels.indexOf(this.requiredLevel);
    
    return currentIndex >= requiredIndex;
  }
}
