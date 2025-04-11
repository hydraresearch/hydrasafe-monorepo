import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { Logger } from '../../utils/logger';
import { SecurityService } from '../security/security.service';

interface Transaction {
  from: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

interface ValidationResult {
  valid: boolean;
  riskLevel: string;
  riskScore: number;
  warnings: string[];
  details: any;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly securityService: SecurityService) {}

  /**
   * Validate a transaction using security services
   */
  async validateTransaction(transaction: Transaction, userId: string): Promise<ValidationResult> {
    try {
      this.logger.log(`Validating transaction from ${transaction.from} to ${transaction.to}`);

      // Get security validation from security service
      const securityValidation = await this.securityService.validateTransaction(
        transaction,
        userId,
      );

      // Perform additional transaction-specific validations
      const warnings = this.checkForCommonScams(transaction);

      // Calculate final risk score
      const riskScore = this.calculateRiskScore(transaction, warnings.length);

      return {
        valid: securityValidation.valid,
        riskLevel: securityValidation.riskLevel,
        riskScore,
        warnings,
        details: {
          transactionType: this.determineTransactionType(transaction),
          estimatedGasCost: this.estimateGasCost(transaction),
          securityDetails: securityValidation.details,
        },
      };
    } catch (error) {
      this.logger.error('Transaction validation failed', error.stack);
      throw error;
    }
  }

  /**
   * Sign and submit a transaction
   */
  async signAndSubmitTransaction(transaction: Transaction, privateKey: string): Promise<string> {
    try {
      this.logger.log('Preparing to sign and submit transaction');

      // Create a wallet instance with the private key
      const wallet = new ethers.Wallet(privateKey);

      // Sign the transaction
      const signedTransaction = await wallet.signTransaction({
        to: transaction.to,
        value: ethers.parseEther(transaction.value),
        data: transaction.data || '0x',
        gasLimit: transaction.gasLimit ? ethers.parseUnits(transaction.gasLimit, 'wei') : undefined,
        gasPrice: transaction.gasPrice ? ethers.parseUnits(transaction.gasPrice, 'wei') : undefined,
        nonce: transaction.nonce,
      });

      // In a real implementation, we would broadcast this to the network
      // For MVP purposes, we'll just return the signed transaction
      this.logger.log('Transaction signed successfully');

      return signedTransaction;
    } catch (error) {
      this.logger.error('Transaction signing failed', error.stack);
      throw error;
    }
  }

  /**
   * Check for common scam patterns in the transaction
   */
  private checkForCommonScams(transaction: Transaction): string[] {
    const warnings: string[] = [];

    // Check for unusually high value transfers
    if (parseFloat(transaction.value) > 10) {
      warnings.push('Large value transfer detected. Please verify the recipient.');
    }

    // Check for suspicious contract interactions
    if (transaction.data && transaction.data !== '0x') {
      if (transaction.data.includes('transfer') || transaction.data.includes('approve')) {
        warnings.push(
          'This transaction contains token approval or transfer functions. Verify the contract.',
        );
      }
    }

    return warnings;
  }

  /**
   * Calculate a risk score for the transaction
   */
  private calculateRiskScore(transaction: Transaction, warningCount: number): number {
    let score = 0;

    // Base score from warning count
    score += warningCount * 20;

    // Add score based on transaction value
    const value = parseFloat(transaction.value);
    if (value > 50) score += 40;
    else if (value > 10) score += 20;
    else if (value > 1) score += 10;

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Determine the type of transaction
   */
  private determineTransactionType(transaction: Transaction): string {
    if (!transaction.data || transaction.data === '0x') {
      return 'Simple ETH Transfer';
    }

    if (transaction.data.includes('0xa9059cbb')) {
      return 'ERC20 Token Transfer';
    }

    if (transaction.data.includes('0x095ea7b3')) {
      return 'ERC20 Token Approval';
    }

    if (transaction.data.includes('0x23b872dd')) {
      return 'ERC20 TransferFrom';
    }

    return 'Contract Interaction';
  }

  /**
   * Estimate the gas cost for a transaction
   */
  private estimateGasCost(transaction: Transaction): string {
    // In a real implementation, this would use the provider to estimate gas
    // For MVP purposes, we'll return a placeholder
    return '0.005 ETH';
  }
}
