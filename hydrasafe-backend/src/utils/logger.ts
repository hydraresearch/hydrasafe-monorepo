/**
 * Logger utility for HydraSafe backend
 * Provides consistent logging across the application using NestJS Logger
 */

import { Injectable, LoggerService, Logger as NestLogger } from '@nestjs/common';

// Logger interface matching NestJS LoggerService
@Injectable()
export class Logger implements LoggerService {
  private context?: string;
  private nestLogger: NestLogger;

  constructor(context?: string) {
    this.context = context;
    this.nestLogger = new NestLogger(context);
  }

  /**
   * Format metadata for logging
   */
  private formatMeta(meta?: any): string {
    if (!meta) return '';
    try {
      return JSON.stringify(meta, null, 2);
    } catch (e) {
      return String(meta);
    }
  }

  /**
   * Log a debug message
   */
  debug(message: any, context?: string, meta?: any): void {
    this.nestLogger.debug(
      `${message} ${meta ? this.formatMeta(meta) : ''}`,
      context || this.context,
    );
  }

  /**
   * Log an info message
   */
  log(message: any, context?: string, meta?: any): void {
    this.nestLogger.log(`${message} ${meta ? this.formatMeta(meta) : ''}`, context || this.context);
  }

  /**
   * Log an info message (alias for log)
   */
  info(message: any, meta?: any, context?: string): void {
    this.log(message, context, meta);
  }

  /**
   * Log a warning message
   */
  warn(message: any, context?: string, meta?: any): void {
    this.nestLogger.warn(
      `${message} ${meta ? this.formatMeta(meta) : ''}`,
      context || this.context,
    );
  }

  /**
   * Log an error message
   */
  error(message: any, trace?: string, context?: string, meta?: any): void {
    this.nestLogger.error(
      `${message} ${meta ? this.formatMeta(meta) : ''}`,
      trace,
      context || this.context,
    );
  }

  /**
   * Log a verbose message
   */
  verbose(message: any, context?: string, meta?: any): void {
    this.nestLogger.verbose(
      `${message} ${meta ? this.formatMeta(meta) : ''}`,
      context || this.context,
    );
  }
}

// Create and export the logger instance
export const logger = new Logger('HydraSafe');
