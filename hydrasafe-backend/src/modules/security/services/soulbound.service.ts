import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { Logger } from '../../../utils/logger';

export interface SoulboundIdentity {
  id: string;
  walletAddress: string;
  identityFactors: string[];
  createdAt: number;
  updatedAt: number;
  verificationHash: string;
  recoveryIds: string[];
}

/**
 * Soulbound Service
 * Implements identity binding mechanisms to prevent unauthorized transfers
 * and create identity verification using zero-knowledge principles
 */
@Injectable()
export class SoulboundService {
  private readonly logger = new Logger(SoulboundService.name);
  private readonly identities: Map<string, SoulboundIdentity> = new Map();
  private readonly walletBindings: Map<string, string> = new Map();

  /**
   * Create a soulbound identity
   */
  async createIdentity(
    walletAddress: string,
    identityFactors: string[],
  ): Promise<SoulboundIdentity> {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();

      // Check if wallet is already bound
      if (this.walletBindings.has(normalizedAddress)) {
        throw new Error(`Wallet ${normalizedAddress} is already bound to an identity`);
      }

      // Generate unique identity ID
      const identityId = ethers.hexlify(ethers.randomBytes(16));

      // Create identity
      const identity: SoulboundIdentity = {
        id: identityId,
        walletAddress: normalizedAddress,
        identityFactors,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        verificationHash: '',
        recoveryIds: [],
      };

      // Generate verification hash
      identity.verificationHash = this.generateVerificationHash(identity);

      // Store identity
      this.identities.set(identityId, identity);
      this.walletBindings.set(normalizedAddress, identityId);

      this.logger.info(`Created soulbound identity for wallet ${normalizedAddress}`, {
        identityId,
        factorCount: identityFactors.length,
      });

      return identity;
    } catch (error) {
      this.logger.error('Failed to create soulbound identity', error.stack);
      throw new Error('Failed to create soulbound identity');
    }
  }

  /**
   * Verify a soulbound identity
   */
  async verifyIdentity(identityId: string, walletAddress: string): Promise<boolean> {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();

      // Get identity
      const identity = this.identities.get(identityId);
      if (!identity) {
        this.logger.warn(`Identity ${identityId} not found`);
        return false;
      }

      // Check wallet binding
      if (identity.walletAddress !== normalizedAddress) {
        this.logger.warn(`Wallet ${normalizedAddress} is not bound to identity ${identityId}`);
        return false;
      }

      // Verify hash
      const expectedHash = this.generateVerificationHash(identity);
      if (identity.verificationHash !== expectedHash) {
        this.logger.warn(`Identity ${identityId} has invalid verification hash`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to verify identity', error.stack);
      return false;
    }
  }

  /**
   * Bind a recovery mechanism to an identity
   */
  async bindRecovery(identityId: string, recoveryId: string): Promise<boolean> {
    try {
      // Get identity
      const identity = this.identities.get(identityId);
      if (!identity) {
        throw new Error(`Identity ${identityId} not found`);
      }

      // Add recovery ID
      if (!identity.recoveryIds.includes(recoveryId)) {
        identity.recoveryIds.push(recoveryId);
        identity.updatedAt = Date.now();
        identity.verificationHash = this.generateVerificationHash(identity);

        // Update stored identity
        this.identities.set(identityId, identity);
      }

      this.logger.log(`Bound recovery ${recoveryId} to identity ${identityId}`);

      return true;
    } catch (error) {
      this.logger.error('Failed to bind recovery', error.stack);
      return false;
    }
  }

  /**
   * Update identity factors
   */
  async updateIdentityFactors(
    identityId: string,
    walletAddress: string,
    newFactors: string[],
  ): Promise<boolean> {
    try {
      // Normalize wallet address
      const normalizedAddress = walletAddress.toLowerCase();

      // Get identity
      const identity = this.identities.get(identityId);
      if (!identity) {
        throw new Error(`Identity ${identityId} not found`);
      }

      // Verify wallet binding
      if (identity.walletAddress !== normalizedAddress) {
        throw new Error(`Wallet ${normalizedAddress} is not bound to identity ${identityId}`);
      }

      // Update factors
      identity.identityFactors = newFactors;
      identity.updatedAt = Date.now();
      identity.verificationHash = this.generateVerificationHash(identity);

      // Update stored identity
      this.identities.set(identityId, identity);

      this.logger.log(`Updated identity factors for ${identityId}`, this.constructor.name, {
        factorCount: newFactors.length,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to update identity factors', error.stack);
      return false;
    }
  }

  /**
   * Recover identity using recovery mechanism
   */
  async recoverIdentity(recoveryId: string, newWalletAddress: string): Promise<SoulboundIdentity> {
    try {
      // Normalize wallet address
      const normalizedAddress = newWalletAddress.toLowerCase();

      // Check if wallet is already bound
      if (this.walletBindings.has(normalizedAddress)) {
        throw new Error(`Wallet ${normalizedAddress} is already bound to an identity`);
      }

      // Find identity with the recovery ID
      let targetIdentity: SoulboundIdentity | null = null;

      for (const identity of this.identities.values()) {
        if (identity.recoveryIds.includes(recoveryId)) {
          targetIdentity = identity;
          break;
        }
      }

      if (!targetIdentity) {
        throw new Error(`No identity found with recovery ID ${recoveryId}`);
      }

      // Remove old wallet binding
      this.walletBindings.delete(targetIdentity.walletAddress);

      // Update identity
      targetIdentity.walletAddress = normalizedAddress;
      targetIdentity.updatedAt = Date.now();
      targetIdentity.verificationHash = this.generateVerificationHash(targetIdentity);

      // Update stored identity and bindings
      this.identities.set(targetIdentity.id, targetIdentity);
      this.walletBindings.set(normalizedAddress, targetIdentity.id);

      this.logger.log(`Recovered identity ${targetIdentity.id} to wallet ${normalizedAddress}`);

      return targetIdentity;
    } catch (error) {
      this.logger.error('Failed to recover identity', error.stack);
      throw new Error('Failed to recover identity');
    }
  }

  /**
   * Generate verification hash for an identity
   */
  private generateVerificationHash(identity: SoulboundIdentity): string {
    // Create a copy without the verification hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { verificationHash, ...identityData } = identity;

    // Serialize and hash
    const serialized = JSON.stringify(identityData);
    return ethers.keccak256(ethers.toUtf8Bytes(serialized));
  }
}
