// eslint-disable-next-line prettier/prettier
import { Injectable } from '@nestjs/common';
import { QZKPService } from './services/qzkp.service';
import { LMVSService } from './services/lmvs.service';
import { VISEService } from './services/vise.service';
import { SoulboundService } from './services/soulbound.service';
import { Logger } from '../../utils/logger';
import * as bcrypt from 'bcryptjs';
import { SecurityLevel } from '@common/security/types';

/**
 * Unified Security Service
 * Integrates all security components (VISE, QZKP, LMVS, Soulbound)
 * for authentication flows and transaction validation
 */
@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    private readonly qzkpService: QZKPService,
    private readonly lmvsService: LMVSService,
    private readonly viseService: VISEService,
    private readonly soulboundService: SoulboundService,
  ) {
    this.logger.log('SecurityService initialized');
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate a transaction using all security components
   */
  async validateTransaction(
    transaction: any,
    userId: string,
  ): Promise<{ valid: boolean; riskLevel: string; details?: any }> {
    try {
      // Default tenantId to 'default' if not provided
      const tenantId = transaction.tenantId || 'default';

      // Get IP address and user agent from transaction or use defaults
      const ipAddress = transaction.ipAddress || '127.0.0.1';
      const userAgent = transaction.userAgent || 'HydraSafe Client';

      // Create security context with all required parameters
      const securityContext = await this.viseService.createContext(
        userId,
        SecurityLevel.HIGH,
        tenantId,
        // Adding additional required parameters
        ipAddress,
        userAgent,
      );

      // Verify identity binding
      const identityValid = await this.soulboundService.verifyIdentity(
        userId,
        transaction.walletAddress,
      );

      if (!identityValid) {
        return {
          valid: false,
          riskLevel: 'CRITICAL',
          details: { reason: 'Identity validation failed' },
        };
      }

      // Generate and verify proof
      const proof = await this.qzkpService.generateProof(transaction.data, userId);
      const proofValid = await this.qzkpService.verifyProof(proof);

      if (!proofValid) {
        return {
          valid: false,
          riskLevel: 'HIGH',
          details: { reason: 'Proof verification failed' },
        };
      }

      // Verify with LMVS
      const lmvsValid = await this.lmvsService.validateVector(
        transaction.data,
        userId,
        securityContext.sessionId, // Use sessionId instead of id
      );

      if (!lmvsValid) {
        return {
          valid: false,
          riskLevel: 'MEDIUM',
          details: { reason: 'LMVS validation failed' },
        };
      }

      return {
        valid: true,
        riskLevel: 'LOW',
        details: { reason: 'All validations passed' },
      };
    } catch (error) {
      this.logger.error('Transaction validation failed', error.stack);
      return {
        valid: false,
        riskLevel: 'CRITICAL',
        details: { reason: 'Error during validation' },
      };
    }
  }

  /**
   * Get the security context for a user
   */
  async getSecurityContext(userId: string, ipAddress?: string, userAgent?: string): Promise<any> {
    try {
      this.logger.log(`Getting security context for user ${userId}`);

      // Create or retrieve a security context using VISE service
      // Default tenantId to 'default' if not provided
      const tenantId = 'default';
      // Set default values for IP and user agent if not provided
      const clientIp = ipAddress || '127.0.0.1';
      const clientUserAgent = userAgent || 'HydraSafe Client';

      const securityContext = await this.viseService.createContext(
        userId,
        SecurityLevel.MEDIUM,
        tenantId,
        clientIp,
        clientUserAgent,
      );

      return securityContext;
    } catch (error) {
      this.logger.error(`Failed to get security context for user ${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * Authenticate a user with enhanced security
   */
  async authenticateWithSecurity(
    userId: string,
    credentials: any,
  ): Promise<{ authenticated: boolean; securityContext: any }> {
    try {
      // Default tenantId to 'default' if not provided
      const tenantId = credentials.tenantId || 'default';

      // Extract IP and user agent from credentials or use defaults
      const ipAddress = credentials.ipAddress || '127.0.0.1';
      const userAgent = credentials.userAgent || 'HydraSafe Client';

      // Create security context with all required parameters
      const securityContext = await this.viseService.createContext(
        userId,
        SecurityLevel.MEDIUM,
        tenantId,
        ipAddress,
        userAgent,
      );

      // Verify identity
      const identityValid = await this.soulboundService.verifyIdentity(
        userId,
        credentials.walletAddress,
      );

      if (!identityValid) {
        return { authenticated: false, securityContext: null };
      }

      // Generate and verify authentication proof
      const proof = await this.qzkpService.generateProof(credentials, userId);
      const proofValid = await this.qzkpService.verifyProof(proof);

      if (!proofValid) {
        return { authenticated: false, securityContext: null };
      }

      return {
        authenticated: true,
        securityContext,
      };
    } catch (error) {
      this.logger.error('Authentication failed', error.stack);
      return { authenticated: false, securityContext: null };
    }
  }

  /**
   * Create a recovery mechanism using LMVS
   */
  async setupRecovery(
    userId: string,
    recoveryData: any,
  ): Promise<{ success: boolean; recoveryId: string }> {
    try {
      // Default tenantId to 'default' if not provided
      const tenantId = recoveryData.tenantId || 'default';

      // Extract IP and user agent from recovery data or use defaults
      const ipAddress = recoveryData.ipAddress || '127.0.0.1';
      const userAgent = recoveryData.userAgent || 'HydraSafe Client';

      // Create high security context with all required parameters
      await this.viseService.createContext(
        userId,
        SecurityLevel.HIGH,
        tenantId,
        ipAddress,
        userAgent,
      );

      // Generate recovery shares
      const { recoveryId } = await this.lmvsService.generateShares(
        recoveryData.secret,
        recoveryData.threshold,
        recoveryData.total,
      );

      // Bind recovery to identity
      await this.soulboundService.bindRecovery(userId, recoveryId);

      return { success: true, recoveryId };
    } catch (error) {
      this.logger.error('Recovery setup failed', error.stack);
      return { success: false, recoveryId: null };
    }
  }

  /**
   * Recover using shares
   */
  async recoverWithShares(
    recoveryId: string,
    shares: any[],
  ): Promise<{ success: boolean; secret: string }> {
    try {
      // Recover secret
      const secret = await this.lmvsService.recoverSecret(recoveryId, shares);

      if (!secret) {
        return { success: false, secret: null };
      }

      return { success: true, secret };
    } catch (error) {
      this.logger.error('Recovery failed', error.stack);
      return { success: false, secret: null };
    }
  }
}
