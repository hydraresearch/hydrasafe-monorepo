import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { Logger } from '../../../utils/logger';
import { SecurityLevel, SecurityContext, SESSION_TIMEOUTS } from '@common/security/types';
import { FunctionAccessControl } from '@common/security/vise';

/**
 * Virtual Isolation Security Enclave (VISE) Service
 * Creates isolated security contexts with different security levels
 * and appropriate controls
 */
@Injectable()
export class VISEService {
  private readonly logger = new Logger(VISEService.name);
  private readonly contexts: Map<string, SecurityContext> = new Map();
  private readonly functionRegistry: Map<string, FunctionAccessControl> = new Map();

  // Security level timeouts in milliseconds
  private readonly securityTimeouts: Record<SecurityLevel, number> = {
    LOW: SESSION_TIMEOUTS[SecurityLevel.LOW] * 1000,
    MEDIUM: SESSION_TIMEOUTS[SecurityLevel.MEDIUM] * 1000,
    HIGH: SESSION_TIMEOUTS[SecurityLevel.HIGH] * 1000,
    CRITICAL: SESSION_TIMEOUTS[SecurityLevel.CRITICAL] * 1000,
  };

  // Allowed functions per security level
  private readonly allowedFunctionsByLevel: Record<SecurityLevel, string[]> = {
    LOW: ['read', 'view', 'list', 'get'],
    MEDIUM: ['read', 'view', 'list', 'get', 'update', 'verify'],
    HIGH: ['read', 'view', 'list', 'get', 'update', 'verify', 'create', 'sign'],
    CRITICAL: [
      'read',
      'view',
      'list',
      'get',
      'update',
      'verify',
      'create',
      'sign',
      'delete',
      'recover',
    ],
  };

  /**
   * Create a new security context
   */
  async createContext(
    userId: string,
    level: SecurityLevel,
    tenantId: string,
    ipAddress: string = '127.0.0.1',
    userAgent: string = 'HydraSafe Client',
  ): Promise<SecurityContext> {
    try {
      // Generate unique session ID
      const sessionId = ethers.hexlify(ethers.randomBytes(16));
      // Create the context
      const context: SecurityContext = {
        sessionId,
        userId,
        tenantId,
        securityLevel: level,
        timestamp: Date.now(),
        sessionTimeout: this.securityTimeouts[level],
        allowedFunctions: this.allowedFunctionsByLevel[level],
        metadata: {
          callerId: ethers.hexlify(ethers.randomBytes(8)),
          ipAddress, // Add IP address
          userAgent, // Add user agent
          createdAt: Date.now(),
        },
      };

      this.contexts.set(sessionId, context);
      this.logger.log(
        `Created ${level} security context for user ${userId} - Session ID: ${sessionId}, Expires in: ${this.securityTimeouts[level] / 1000 / 60} minutes`,
      );
      return context;
    } catch (error) {
      this.logger.error('Failed to create security context', error);
      throw error;
    }
  }

  /**
   * Validate a security context
   */
  async validateContext(sessionId: string, functionName: string): Promise<boolean> {
    try {
      // Get context
      const context = this.contexts.get(sessionId);
      if (!context) {
        this.logger.warn(`Context ${sessionId} not found`);
        return false;
      }

      // Check expiration
      if (Date.now() > context.timestamp + context.sessionTimeout) {
        this.logger.warn(`Context ${sessionId} has expired`);
        this.contexts.delete(sessionId);
        return false;
      }

      // Check function allowance
      if (!context.allowedFunctions.includes(functionName)) {
        this.logger.warn(`Function ${functionName} not allowed in context ${sessionId}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to validate context', error);
      throw error;
    }
  }

  /**
   * Store data in a security context
   */
  async storeContextData(sessionId: string, key: string, value: unknown): Promise<boolean> {
    try {
      // Get context
      const context = this.contexts.get(sessionId);
      if (!context) {
        throw new Error(`Context ${sessionId} not found`);
      }

      // Store data
      context.metadata[key] = value;

      // Update stored context
      this.contexts.set(sessionId, context);

      return true;
    } catch (error) {
      this.logger.error('Failed to store context data', error);
      throw error;
    }
  }

  /**
   * Retrieve data from a security context
   */
  async getContextData(sessionId: string, key: string): Promise<unknown> {
    try {
      // Get context
      const context = this.contexts.get(sessionId);
      if (!context) {
        throw new Error(`Context ${sessionId} not found`);
      }

      // Get data
      return context.metadata[key];
    } catch (error) {
      this.logger.error('Failed to get context data', error);
      throw error;
    }
  }

  /**
   * Terminate a security context
   */
  async terminateContext(sessionId: string): Promise<boolean> {
    try {
      // Get context
      const context = this.contexts.get(sessionId);
      if (!context) {
        throw new Error(`Context ${sessionId} not found`);
      }

      // Remove context
      this.contexts.delete(sessionId);

      return true;
    } catch (error) {
      this.logger.error('Failed to terminate context', error);
      throw error;
    }
  }

  /**
   * Register a function with its security requirements
   */
  registerFunction(
    name: string,
    requiredLevel: SecurityLevel,
    allowedRoles: string[] = [],
  ): void {
    this.functionRegistry.set(name, {
      name,
      requiredLevel,
      allowedRoles,
    });
  }

  /**
   * Elevate a security context to a higher security level
   */
  async elevateContext(
    sessionId: string,
    newLevel: SecurityLevel,
    authenticationFactor?: string,
  ): Promise<SecurityContext> {
    try {
      // Get context
      const context = this.contexts.get(sessionId);
      if (!context) {
        throw new Error(`Context ${sessionId} not found`);
      }

      // Validate current context
      if (!(await this.validateContext(sessionId, ''))) {
        throw new Error('Cannot elevate an invalid or expired context');
      }

      // Check if new level is actually higher
      if (
        this.getSecurityLevelValue(newLevel) <=
        this.getSecurityLevelValue(context.securityLevel)
      ) {
        throw new Error('New security level must be higher than current level');
      }

      // For HIGH and CRITICAL levels, require additional authentication
      if (
        (newLevel === SecurityLevel.HIGH || newLevel === SecurityLevel.CRITICAL) &&
        !authenticationFactor
      ) {
        throw new Error('Additional authentication required for elevated security levels');
      }

      // Create elevated context
      const elevatedContext: SecurityContext = {
        ...context,
        securityLevel: newLevel,
        timestamp: Date.now(),
        sessionTimeout: this.securityTimeouts[newLevel],
        allowedFunctions: this.getAllowedFunctions(newLevel),
      };

      // Update stored context
      this.contexts.set(sessionId, elevatedContext);
      return elevatedContext;
    } catch (error) {
      this.logger.error('Failed to elevate context', error);
      throw error;
    }
  }

  /**
   * Extend the lifetime of a security context
   */
  async extendContext(sessionId: string): Promise<SecurityContext> {
    try {
      // Get context
      const context = this.contexts.get(sessionId);
      if (!context) {
        throw new Error(`Context ${sessionId} not found`);
      }

      // Validate current context
      if (!(await this.validateContext(sessionId, ''))) {
        throw new Error('Cannot extend an invalid or expired context');
      }

      // Create extended context
      const extendedContext: SecurityContext = {
        ...context,
        timestamp: Date.now(),
        sessionTimeout: this.securityTimeouts[context.securityLevel],
      };

      // Update stored context
      this.contexts.set(sessionId, extendedContext);
      return extendedContext;
    } catch (error) {
      this.logger.error('Failed to extend context', error);
      throw error;
    }
  }

  /**
   * Get all functions allowed for a specific security level
   */
  private getAllowedFunctions(level: SecurityLevel): string[] {
    return this.allowedFunctionsByLevel[level] || [];
  }

  /**
   * Convert security level to numeric value for comparison
   */
  private getSecurityLevelValue(level: SecurityLevel): number {
    switch (level) {
      case SecurityLevel.LOW:
        return 1;
      case SecurityLevel.MEDIUM:
        return 2;
      case SecurityLevel.HIGH:
        return 3;
      case SecurityLevel.CRITICAL:
        return 4;
      default:
        throw new Error(`Invalid security level: ${level}`);
    }
  }
}
