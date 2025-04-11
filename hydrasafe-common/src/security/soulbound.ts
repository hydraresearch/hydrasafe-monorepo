/**
 * Soulbound Implementation
 * 
 * This module implements the Soulbound mechanism for binding wallets to identities
 * and preventing unauthorized transfers while maintaining secure verification.
 */

import crypto from 'crypto';
import { generateQZKPProof, verifyQZKPProof } from './qzkp';

/**
 * Interface for Soulbound Identity
 */
export interface SoulboundIdentity {
  identityHash: string;
  walletAddress: string;
  bindingProof: string;
  createdAt: number;
  metadata: {
    version: string;
    deviceFingerprint: string;
    biometricHash?: string;
  };
}

/**
 * Interface for Identity Verification Result
 */
export interface IdentityVerificationResult {
  isValid: boolean;
  score: number;
  verificationMethod: string;
  timestamp: number;
}

/**
 * Creates a soulbound identity binding a wallet to an identity
 */
export async function createSoulboundIdentity(
  walletAddress: string,
  identityFactors: string[],
  deviceFingerprint: string,
  biometricHash?: string
): Promise<SoulboundIdentity> {
  try {
    // Generate identity hash from identity factors
    const identityHash = generateIdentityHash(identityFactors);
    
    // Create binding vector (combines wallet address and identity hash)
    const bindingVector = createBindingVector(walletAddress, identityHash);
    
    // Generate binding proof using QZKP
    const bindingProof = await generateQZKPProof(bindingVector, identityHash);
    
    // Create soulbound identity
    const soulboundIdentity: SoulboundIdentity = {
      identityHash,
      walletAddress,
      bindingProof,
      createdAt: Date.now(),
      metadata: {
        version: '1.0',
        deviceFingerprint,
        biometricHash
      }
    };
    
    return soulboundIdentity;
  } catch (error) {
    console.error('Soulbound identity creation failed:', error);
    throw new Error('Failed to create soulbound identity');
  }
}

/**
 * Verifies a soulbound identity
 */
export function verifySoulboundIdentity(
  identity: SoulboundIdentity,
  walletAddress: string
): IdentityVerificationResult {
  try {
    // Verify wallet address matches
    if (identity.walletAddress !== walletAddress) {
      return {
        isValid: false,
        score: 0,
        verificationMethod: 'address_match',
        timestamp: Date.now()
      };
    }
    
    // Verify binding proof using QZKP
    const isProofValid = verifyQZKPProof(identity.bindingProof);
    if (!isProofValid) {
      return {
        isValid: false,
        score: 0,
        verificationMethod: 'binding_proof',
        timestamp: Date.now()
      };
    }
    
    // Calculate verification score (1.0 = 100%)
    const score = calculateVerificationScore(identity);
    
    return {
      isValid: true,
      score,
      verificationMethod: 'binding_proof',
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Soulbound identity verification failed:', error);
    return {
      isValid: false,
      score: 0,
      verificationMethod: 'error',
      timestamp: Date.now()
    };
  }
}

/**
 * Checks if a wallet transfer is allowed (always false for soulbound wallets)
 */
export function isTransferAllowed(
  identity: SoulboundIdentity,
  fromAddress: string,
  toAddress: string
): boolean {
  // Soulbound wallets cannot be transferred
  return false;
}

/**
 * Updates the identity verification with additional factors
 */
export async function updateIdentityVerification(
  identity: SoulboundIdentity,
  additionalFactors: string[]
): Promise<SoulboundIdentity> {
  try {
    // Generate new binding vector with additional factors
    const bindingVector = createBindingVector(
      identity.walletAddress, 
      identity.identityHash,
      additionalFactors
    );
    
    // Generate new binding proof
    const bindingProof = await generateQZKPProof(bindingVector, identity.identityHash);
    
    // Create updated identity
    const updatedIdentity: SoulboundIdentity = {
      ...identity,
      bindingProof,
      metadata: {
        ...identity.metadata,
        version: '1.1' // Increment version
      }
    };
    
    return updatedIdentity;
  } catch (error) {
    console.error('Identity verification update failed:', error);
    throw new Error('Failed to update identity verification');
  }
}

/**
 * Generates an identity hash from multiple identity factors
 */
function generateIdentityHash(identityFactors: string[]): string {
  // Sort factors for consistency
  const sortedFactors = [...identityFactors].sort();
  
  // Create a combined string
  const combinedFactors = sortedFactors.join('|');
  
  // Generate hash
  return crypto.createHash('sha256').update(combinedFactors).digest('hex');
}

/**
 * Creates a binding vector that combines wallet address and identity
 */
function createBindingVector(
  walletAddress: string, 
  identityHash: string,
  additionalFactors: string[] = []
): number[] {
  // Create a combined string
  const combinedString = `${walletAddress}|${identityHash}|${additionalFactors.join('|')}`;
  
  // Generate a deterministic seed from the combined string
  const seed = crypto.createHash('sha512').update(combinedString).digest();
  
  // Create a vector of 8 dimensions using the seed
  const vector: number[] = [];
  for (let i = 0; i < 8; i++) {
    // Use 4 bytes (32 bits) for each dimension
    const value = seed.readUInt32BE(i * 4) / 0xFFFFFFFF; // Normalize to [0, 1]
    vector.push(value);
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

/**
 * Calculates a verification score for the identity
 */
function calculateVerificationScore(identity: SoulboundIdentity): number {
  // Base score for valid binding
  let score = 0.7;
  
  // Additional score for biometric verification
  if (identity.metadata.biometricHash) {
    score += 0.3;
  }
  
  // Age penalty (reduces score for very old identities that might be compromised)
  const ageInDays = (Date.now() - identity.createdAt) / (1000 * 60 * 60 * 24);
  if (ageInDays > 365) { // Older than a year
    score -= 0.1;
  }
  
  // Ensure score is in [0, 1] range
  return Math.max(0, Math.min(1, score));
}
