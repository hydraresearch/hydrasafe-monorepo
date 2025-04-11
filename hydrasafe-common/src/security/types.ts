/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
export enum SecurityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SecurityContext {
  sessionId: string;
  securityLevel: SecurityLevel;
  timestamp: number;
  userId: string;
  tenantId: string;
  sessionTimeout: number;
  allowedFunctions: string[];
  callerId?: string;
  metadata?: Record<string, unknown>;
  id?: string; // Adding id property that was missing
}

export interface SecurityMetadata {
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  additionalData?: Record<string, unknown>;
}

export interface SecurityConfig {
  defaultSecurityLevel: SecurityLevel;
  sessionTimeout: number;
  maxSessionDuration: number;
  allowedOrigins: string[];
  allowedIps: string[];
  rateLimits: {
    [key: string]: {
      maxRequests: number;
      timeWindow: number;
    };
  };
}

export type ClassDecorator<T extends new (...args: any[]) => object> = (
  target: T
) => T;

export type MethodDecorator = (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;

// Add SESSION_TIMEOUTS constant
export const SESSION_TIMEOUTS = {
  [SecurityLevel.LOW]: 3600000,     // 1 hour
  [SecurityLevel.MEDIUM]: 1800000,  // 30 minutes
  [SecurityLevel.HIGH]: 900000,     // 15 minutes
  [SecurityLevel.CRITICAL]: 300000  // 5 minutes
};
