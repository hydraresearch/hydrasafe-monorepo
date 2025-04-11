/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Virtual Isolation Security Enclave (VISE) Implementation
 * 
 * This module implements the VISE system for creating isolated security contexts
 * with different security levels and appropriate controls.
 */

import crypto from 'crypto';
import { SecurityLevel, ClassDecorator, MethodDecorator } from './types';

/**
 * Interface for function access control
 */
export interface FunctionAccessControl {
  name: string;
  requiredLevel: SecurityLevel;
  allowedRoles: string[];
}

export { SecurityLevel };

/**
 * Session timeouts in seconds for each security level
 */
export const SESSION_TIMEOUTS = {
  [SecurityLevel.LOW]: 3600,      // 1 hour
  [SecurityLevel.MEDIUM]: 1800,   // 30 minutes
  [SecurityLevel.HIGH]: 900,      // 15 minutes
  [SecurityLevel.CRITICAL]: 300   // 5 minutes
};

/**
 * Interface for VISE context
 */
export interface VISEContext {
  sessionId: string;
  userId: string;
  tenantId: string;
  securityLevel: SecurityLevel;
  timestamp: number;
  sessionTimeout: number;
  allowedFunctions: string[];
  callerId?: string;
  metadata: SecurityMetadata;
  roles: string[];
  rateLimit: RateLimitConfig;
}

// Registry of allowed functions with their security requirements
const functionRegistry: Map<string, FunctionAccessControl> = new Map();

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
}

// Security metadata tracking
interface SecurityMetadata {
  ipAddress: string;
  userAgent: string;
  deviceId: string;
  geolocation?: {
    country: string;
    region: string;
    city: string;
  };
  riskScore: number;
  lastAccess: number;
  requestCount: number;
}

// Audit log entry
interface AuditLogEntry {
  timestamp: number;
  userId: string;
  sessionId: string;
  action: string;
  result: 'success' | 'failure';
  metadata: Record<string, unknown>;
}

/**
 * Creates a new VISE context with the specified security level
 */
export function createVISEContext(
  userId: string,
  securityLevel: SecurityLevel,
  deviceId: string,
  ipAddress: string,
  userAgent: string
): VISEContext {
  // Generate a unique context ID
  const contextId = crypto.randomBytes(16).toString('hex');
  
  // Calculate expiration based on security level
  const now = Date.now();
  const timeoutMs = SESSION_TIMEOUTS[securityLevel] * 1000;
  const expiresAt = now + timeoutMs;
  
  // Determine allowed functions based on security level
  const allowedFunctions = getAllowedFunctions(securityLevel);
  
  // Create the context
  const context: VISEContext = {
    sessionId: contextId,
    userId,
    tenantId: deviceId,
    securityLevel,
    timestamp: now,
    sessionTimeout: timeoutMs,
    allowedFunctions,
    metadata: {
      ipAddress,
      userAgent,
      deviceId,
      riskScore: 0,
      lastAccess: now,
      requestCount: 0
    },
    roles: [],
    rateLimit: {
      maxRequests: securityLevel === SecurityLevel.CRITICAL ? 100 : 
                   securityLevel === SecurityLevel.HIGH ? 500 :
                   securityLevel === SecurityLevel.MEDIUM ? 1000 :
                   2000, // LOW
      timeWindow: 60000 // 1 minute
    }
  };
  
  return context;
}

/**
 * Validates a VISE context
 */
export function validateVISEContext(context: VISEContext): boolean {
  // Validate required fields
  if (!context.sessionId || !context.securityLevel || !context.timestamp ||
      !context.userId || !context.tenantId || !context.sessionTimeout) {
    return false;
  }

  // Check session timeout
  const now = Date.now();
  if (now - context.timestamp > context.sessionTimeout) {
    return false;
  }

  // Validate security level
  if (!Object.values(SecurityLevel).includes(context.securityLevel)) {
    return false;
  }

  // Validate rate limits
  if (!RateLimiter.canProceed(context.userId, context.rateLimit)) {
    return false;
  }

  // Validate roles
  if (!context.roles || context.roles.length === 0) {
    return false;
  }

  return true;
}

/**
 * Extends the lifetime of a VISE context
 */
export function extendVISEContext(context: VISEContext): VISEContext {
  // Only extend if context is still valid
  if (!validateVISEContext(context)) {
    throw new Error('Cannot extend an invalid or expired VISE context');
  }
  
  // Calculate new expiration time
  const now = Date.now();
  const timeoutMs = SESSION_TIMEOUTS[context.securityLevel] * 1000;
  const newExpiresAt = now + timeoutMs;
  
  // Create updated context
  return {
    ...context,
    timestamp: now,
    sessionTimeout: timeoutMs
  };
}

/**
 * Elevates the security level of a VISE context
 */
export function elevateVISEContext(
  context: VISEContext, 
  newLevel: SecurityLevel,
  authenticationFactor?: string
): VISEContext {
  // Validate current context
  if (!validateVISEContext(context)) {
    throw new Error('Cannot elevate an invalid or expired VISE context');
  }
  
  // Check if new level is actually higher
  if (getSecurityLevelValue(newLevel) <= getSecurityLevelValue(context.securityLevel)) {
    throw new Error('New security level must be higher than current level');
  }
  
  // For HIGH and CRITICAL levels, require additional authentication
  if (
    (newLevel === SecurityLevel.HIGH || newLevel === SecurityLevel.CRITICAL) && 
    !authenticationFactor
  ) {
    throw new Error('Additional authentication required for elevated security levels');
  }
  
  // Calculate new expiration (shorter for higher security levels)
  const now = Date.now();
  const timeoutMs = SESSION_TIMEOUTS[newLevel] * 1000;
  const newExpiresAt = now + timeoutMs;
  
  // Update allowed functions based on new security level
  const allowedFunctions = getAllowedFunctions(newLevel);
  
  // Create elevated context
  return {
    ...context,
    securityLevel: newLevel,
    timestamp: now,
    sessionTimeout: timeoutMs,
    allowedFunctions,
    rateLimit: {
      maxRequests: newLevel === SecurityLevel.CRITICAL ? 100 : 
                   newLevel === SecurityLevel.HIGH ? 500 :
                   newLevel === SecurityLevel.MEDIUM ? 1000 :
                   2000, // LOW
      timeWindow: 60000 // 1 minute
    }
  };
}

/**
 * Checks if a function is allowed in the current VISE context
 */
export function isAllowedFunction(context: VISEContext, functionName: string): boolean {
  // Validate context first
  if (!validateVISEContext(context)) {
    return false;
  }
  
  // Check if function is in the allowed list
  return context.allowedFunctions.includes(functionName);
}

/**
 * Registers a function with its security requirements
 */
export function registerFunction(
  name: string, 
  requiredLevel: SecurityLevel, 
  allowedRoles: string[] = []
): void {
  functionRegistry.set(name, {
    name,
    requiredLevel,
    allowedRoles
  });
}

/**
 * Gets all functions allowed for a specific security level
 */
function getAllowedFunctions(level: SecurityLevel): string[] {
  const allowedFunctions: string[] = [];
  
  for (const [name, config] of functionRegistry.entries()) {
    if (getSecurityLevelValue(level) >= getSecurityLevelValue(config.requiredLevel)) {
      allowedFunctions.push(name);
    }
  }
  
  return allowedFunctions;
}

/**
 * Converts security level to numeric value for comparison
 */
function getSecurityLevelValue(level: SecurityLevel): number {
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
      return 0;
  }
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private static limits: Map<string, RateLimitConfig> = new Map();
  private static requests: Map<string, number> = new Map();
  private static lastReset: Map<string, number> = new Map();

  static configure(userId: string, config: RateLimitConfig): void {
    RateLimiter.limits.set(userId, config);
  }

  static canProceed(userId: string, rateLimit: RateLimitConfig): boolean {
    const now = Date.now();
    const lastReset = RateLimiter.lastReset.get(userId) || 0;
    const requests = RateLimiter.requests.get(userId) || 0;

    if (now - lastReset > rateLimit.timeWindow) {
      RateLimiter.requests.set(userId, 1);
      RateLimiter.lastReset.set(userId, now);
      return true;
    }

    if (requests >= rateLimit.maxRequests) {
      return false;
    }

    RateLimiter.requests.set(userId, requests + 1);
    return true;
  }
}

/**
 * Audit logger
 */
export class AuditLogger {
  private static logs: AuditLogEntry[] = [];
  private static maxLogs = 10000;

  static log(entry: AuditLogEntry): void {
    if (AuditLogger.logs.length >= AuditLogger.maxLogs) {
      AuditLogger.logs.shift();
    }
    AuditLogger.logs.push(entry);
  }

  static getLogs(userId?: string): AuditLogEntry[] {
    if (userId) {
      return AuditLogger.logs.filter(log => log.userId === userId);
    }
    return AuditLogger.logs;
  }
}

/**
 * Creates a VISE decorator for class protection
 */
export function requireVISEContextClass<T extends new (...args: any[]) => any>(requiredLevel: SecurityLevel): ClassDecorator<T> {
  return function(target: T) {
    const originalConstructor = target;

    function constructor(...args: ConstructorParameters<T>) {
      const context = args[0] as VISEContext;
      
      // Validate context
      if (!validateVISEContext(context)) {
        throw new Error('Invalid or expired VISE context');
      }
      
      // Check security level
      if (getSecurityLevelValue(context.securityLevel) < getSecurityLevelValue(requiredLevel)) {
        throw new Error(`This operation requires ${requiredLevel} security level`);
      }

      // Create instance
      const instance = new originalConstructor(...args);
      return instance;
    }

    Object.defineProperty(constructor, 'name', {
      value: originalConstructor.name
    });

    // Copy prototype to maintain instanceof
    Object.setPrototypeOf(constructor, originalConstructor);
    constructor.prototype = Object.create(originalConstructor.prototype);

    return constructor as T;
  };
}

/**
 * Creates a VISE decorator for method protection
 */
export function requireVISEContext(requiredLevel: SecurityLevel): MethodDecorator {
  return function(
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(this: any, ...args: Parameters<typeof originalMethod>) {
      // First argument should be the VISE context
      const context = args[0] as VISEContext;
      
      // Validate context
      if (!validateVISEContext(context)) {
        throw new Error('Invalid or expired VISE context');
      }
      
      // Check security level
      if (getSecurityLevelValue(context.securityLevel) < getSecurityLevelValue(requiredLevel)) {
        throw new Error(`This operation requires ${requiredLevel} security level`);
      }

      // Check function allowlist
      if (!context.allowedFunctions.includes(propertyKey)) {
        throw new Error(`Function ${propertyKey} is not allowed in this context`);
      }

      // Check caller authorization if provided
      if (context.callerId && context.callerId !== this.constructor.name) {
        throw new Error(`Unauthorized caller: ${this.constructor.name}`);
      }

      // Execute the original method
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Enhanced VISE class
 */
export class VISE {
  private static contexts: Map<string, VISEContext> = new Map();
  private static auditLogger = new AuditLogger();
  private static rateLimiter = new RateLimiter();

  static createContext(
    userId: string,
    tenantId: string,
    securityLevel: SecurityLevel,
    sessionTimeout: number = 300000, // 5 minutes default
    allowedFunctions: string[] = [],
    callerId?: string,
    metadata: SecurityMetadata,
    roles: string[] = []
  ): VISEContext {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const now = Date.now();

    const context: VISEContext = {
      sessionId,
      userId,
      tenantId,
      securityLevel,
      timestamp: now,
      sessionTimeout,
      allowedFunctions,
      callerId,
      metadata,
      roles,
      rateLimit: {
        maxRequests: securityLevel === SecurityLevel.CRITICAL ? 100 : 
                     securityLevel === SecurityLevel.HIGH ? 500 :
                     securityLevel === SecurityLevel.MEDIUM ? 1000 :
                     2000, // LOW
        timeWindow: 60000 // 1 minute
      }
    };

    VISE.contexts.set(sessionId, context);
    VISE.rateLimiter.configure(userId, context.rateLimit);

    // Log context creation
    VISE.auditLogger.log({
      timestamp: now,
      userId,
      sessionId,
      action: 'context_created',
      result: 'success',
      metadata: {
        securityLevel,
        roles
      }
    });

    return context;
  }

  static getContext(sessionId: string): VISEContext | undefined {
    const context = VISE.contexts.get(sessionId);
    if (!context) return undefined;

    // Validate context
    if (!VISE.validateContext(context)) {
      VISE.revokeContext(sessionId);
      return undefined;
    }

    return context;
  }

  static revokeContext(sessionId: string): void {
    const context = VISE.contexts.get(sessionId);
    if (context) {
      VISE.contexts.delete(sessionId);
      VISE.auditLogger.log({
        timestamp: Date.now(),
        userId: context.userId,
        sessionId,
        action: 'context_revoked',
        result: 'success',
        metadata: {}
      });
    }
  }

  static updateContext(
    sessionId: string,
    updates: Partial<VISEContext>
  ): boolean {
    const context = VISE.getContext(sessionId);
    if (!context) return false;

    // Create new context with updates
    const updatedContext = {
      ...context,
      ...updates,
      timestamp: Date.now()
    };

    // Validate updated context
    if (!VISE.validateContext(updatedContext)) return false;

    VISE.contexts.set(sessionId, updatedContext);
    VISE.auditLogger.log({
      timestamp: Date.now(),
      userId: context.userId,
      sessionId,
      action: 'context_updated',
      result: 'success',
      metadata: updates
    });

    return true;
  }

  static validateContext(context: VISEContext): boolean {
    const now = Date.now();
    
    // Basic validation
    if (!context.sessionId || !context.securityLevel || !context.timestamp ||
        !context.userId || !context.tenantId || !context.sessionTimeout) {
      return false;
    }

    // Check session timeout
    if (now - context.timestamp > context.sessionTimeout) {
      return false;
    }

    // Validate security level
    if (!Object.values(SecurityLevel).includes(context.securityLevel)) {
      return false;
    }

    // Validate rate limits
    if (!RateLimiter.canProceed(context.userId, context.rateLimit)) {
      return false;
    }

    // Validate roles
    if (!context.roles || context.roles.length === 0) {
      return false;
    }

    return true;
  }

  static hasRole(context: VISEContext, role: string): boolean {
    return context.roles.includes(role);
  }

  static hasAnyRole(context: VISEContext, roles: string[]): boolean {
    return roles.some(role => VISE.hasRole(context, role));
  }

  static hasAllRoles(context: VISEContext, roles: string[]): boolean {
    return roles.every(role => VISE.hasRole(context, role));
  }

  static getAuditLogs(userId: string): AuditLogEntry[] {
    return VISE.auditLogger.getLogs(userId);
  }

  static getRateLimitInfo(userId: string): RateLimitConfig | undefined {
    return VISE.rateLimiter.limits.get(userId);
  }
}

// Enhanced decorators with additional security features
export function requireVISEContextClass(requiredLevel: SecurityLevel): ClassDecorator {
  return function (target: any) {
    const originalConstructor = target;

    function constructor(...args: any[]) {
      const instance = new originalConstructor(...args);

      // Add security methods
      instance.validateContext = (context: VISEContext) => VISE.validateContext(context);
      instance.hasRole = (context: VISEContext, role: string) => VISE.hasRole(context, role);
      instance.hasAnyRole = (context: VISEContext, roles: string[]) => VISE.hasAnyRole(context, roles);
      instance.hasAllRoles = (context: VISEContext, roles: string[]) => VISE.hasAllRoles(context, roles);

      return instance;
    }

    Object.setPrototypeOf(constructor, originalConstructor);
    Object.setPrototypeOf(constructor.prototype, originalConstructor.prototype);

    return constructor;
  };
}

export function requireVISEContext(requiredLevel: SecurityLevel): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = args[0];
      if (!VISE.validateContext(context)) {
        throw new Error('Invalid or expired VISE context');
      }

      if (context.securityLevel !== requiredLevel) {
        throw new Error(`Operation requires security level ${requiredLevel}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Export default instance
export const vise = new VISE();
