import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { Logger } from '../../utils/logger';
import { SecurityService } from '../security/security.service';

interface WalletInfo {
  address: string;
  balance: string;
  tokens?: TokenBalance[];
  securityScore?: number;
}

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  contractAddress: string;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly securityService: SecurityService) {}

  /**
   * Create a new wallet
   */
  async createWallet(): Promise<{ address: string; privateKey: string }> {
    try {
      this.logger.log('Creating new wallet');

      // Generate a new random wallet
      const wallet = ethers.Wallet.createRandom();

      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
      };
    } catch (error) {
      this.logger.error('Wallet creation failed', error.stack);
      throw error;
    }
  }

  /**
   * Get wallet information
   */
  async getWalletInfo(address: string, userId: string): Promise<WalletInfo> {
    try {
      this.logger.log(`Getting wallet info for ${address}`);

      // In a real implementation, this would connect to a provider to get balance
      // For MVP purposes, we'll return placeholder data

      // Get security score from security service
      const securityContext = await this.securityService.getSecurityContext(userId);
      const securityScore = this.calculateSecurityScore(securityContext);

      return {
        address,
        balance: '10.5 ETH',
        tokens: [
          {
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '1000.00',
            contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          },
          {
            symbol: 'LINK',
            name: 'Chainlink',
            balance: '50.00',
            contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
          },
        ],
        securityScore,
      };
    } catch (error) {
      this.logger.error(`Failed to get wallet info for ${address}`, error.stack);
      throw error;
    }
  }

  /**
   * Bind a wallet to a user's identity using soulbound service
   */
  async bindWalletToIdentity(
    address: string,
    userId: string,
    identityFactors: string[],
  ): Promise<{ success: boolean; identityId: string }> {
    try {
      this.logger.log(`Binding wallet ${address} to user identity`);

      // Create a soulbound identity for the wallet
      const identity = await this.securityService['soulboundService'].createIdentity(
        address,
        identityFactors,
      );

      return {
        success: true,
        identityId: identity.id,
      };
    } catch (error) {
      this.logger.error(`Failed to bind wallet ${address} to identity`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate a security score based on the security context
   */
  private calculateSecurityScore(securityContext: any): number {
    // Base score
    let score = 60;

    // Add points for higher security levels
    if (securityContext.securityLevel === 'HIGH') {
      score += 20;
    } else if (securityContext.securityLevel === 'CRITICAL') {
      score += 30;
    }

    // Add points for additional security factors
    if (securityContext.hasMFA) {
      score += 10;
    }

    if (securityContext.hasRecoverySetup) {
      score += 10;
    }

    // Cap at 100
    return Math.min(score, 100);
  }
}
