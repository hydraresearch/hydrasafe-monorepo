import { ethers } from 'ethers';
import { logger } from '../utils/logger';

interface LMVSVector {
  vector: string;
  layers: string[];
  threshold: number;
  metadata: {
    version: string;
    timestamp: number;
    recoveryHash: string;
  };
}

interface SecretShare {
  index: number;
  share: string;
}

const PRIME_FIELD = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');
const MIN_SHARES = 3;
const MAX_SHARES = 7;

/**
 * Creates a new LMVS vector for secure secret sharing
 */
export async function createLMVSVector(secret: string): Promise<string> {
  try {
    // Generate shares using Shamir's Secret Sharing
    const shares = generateShares(secret, MIN_SHARES, MAX_SHARES);

    // Create layered structure
    const layers = createLayers(shares);

    // Construct vector
    const vector: LMVSVector = {
      vector: ethers.keccak256(ethers.encode(shares)),
      layers,
      threshold: MIN_SHARES,
      metadata: {
        version: '1.0',
        timestamp: Date.now(),
        recoveryHash: await generateRecoveryHash(shares),
      },
    };

    logger.info('LMVS vector created', {
      threshold: vector.threshold,
      layerCount: vector.layers.length,
      timestamp: vector.metadata.timestamp,
    });

    return ethers.encode(vector);
  } catch (error) {
    logger.error('LMVS vector creation failed:', error);
    throw new Error('Failed to create LMVS vector');
  }
}

/**
 * Validates an LMVS vector
 */
export async function validateLMVSVector(vectorString: string): Promise<boolean> {
  try {
    const vector = decodeLMVSVector(vectorString);

    // Verify temporal validity
    if (!isVectorTimeValid(vector)) {
      logger.warn('LMVS vector expired');
      return false;
    }

    // Verify layer integrity
    if (!verifyLayers(vector)) {
      logger.warn('LMVS layer verification failed');
      return false;
    }

    // Verify recovery hash
    const recoveryValid = await verifyRecoveryHash(vector);
    if (!recoveryValid) {
      logger.warn('LMVS recovery hash verification failed');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('LMVS vector validation failed:', error);
    return false;
  }
}

/**
 * Generates Shamir's Secret Sharing shares
 */
function generateShares(secret: string, threshold: number, total: number): SecretShare[] {
  const shares: SecretShare[] = [];
  const secretValue = BigInt(secret);

  // Generate random coefficients for the polynomial
  const coefficients = Array(threshold - 1)
    .fill(0)
    .map(() => generateRandomBigInt());

  // Generate shares using polynomial evaluation
  for (let i = 1; i <= total; i++) {
    let share = secretValue;
    let power = BigInt(1);

    for (const coeff of coefficients) {
      power = (power * BigInt(i)) % PRIME_FIELD;
      share = (share + coeff * power) % PRIME_FIELD;
    }

    shares.push({
      index: i,
      share: share.toString(16).padStart(64, '0'),
    });
  }

  return shares;
}

/**
 * Creates layered structure for shares
 */
function createLayers(shares: SecretShare[]): string[] {
  const layers: string[] = [];

  // Create layers with increasing security
  for (let i = 0; i < shares.length; i++) {
    const layerShares = shares.slice(0, i + 1);
    const layerHash = ethers.keccak256(ethers.encode(layerShares.map((s) => s.share)));
    layers.push(layerHash);
  }

  return layers;
}

/**
 * Generates a recovery hash for the shares
 */
async function generateRecoveryHash(shares: SecretShare[]): Promise<string> {
  const recoveryData = shares.map((s) => ({
    index: s.index,
    hash: ethers.keccak256(ethers.encode([s.share])),
  }));

  return ethers.keccak256(ethers.encode(recoveryData));
}

/**
 * Decodes an LMVS vector string
 */
function decodeLMVSVector(vectorString: string): LMVSVector {
  return ethers.decode(
    [
      'tuple(bytes vector, bytes[] layers, uint8 threshold, tuple(string version, uint256 timestamp, bytes32 recoveryHash) metadata)',
    ],
    vectorString,
  )[0];
}

/**
 * Verifies if the vector is temporally valid
 */
function isVectorTimeValid(vector: LMVSVector): boolean {
  const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year
  const now = Date.now();
  return now - vector.metadata.timestamp <= MAX_AGE;
}

/**
 * Verifies the integrity of vector layers
 */
function verifyLayers(vector: LMVSVector): boolean {
  return (
    vector.layers.length >= MIN_SHARES &&
    vector.layers.length <= MAX_SHARES &&
    vector.threshold <= vector.layers.length
  );
}

/**
 * Verifies the recovery hash of the vector
 */
async function verifyRecoveryHash(vector: LMVSVector): Promise<boolean> {
  try {
    const reconstructedHash = ethers.keccak256(
      ethers.concat([
        ethers.getBytes(vector.vector),
        ...vector.layers.map((l) => ethers.getBytes(l)),
      ]),
    );

    return reconstructedHash === vector.metadata.recoveryHash;
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure random BigInt
 */
function generateRandomBigInt(): bigint {
  const bytes = ethers.randomBytes(32);
  return BigInt('0x' + Buffer.from(bytes).toString('hex')) % PRIME_FIELD;
}
