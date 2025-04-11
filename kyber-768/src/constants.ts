/**
 * Copyright (c) 2025 Hydra Research
 * Author: Nicolas Cloutier
 * GitHub: nicksdigital
 * 
 * ML-KEM (Kyber) Post-Quantum Cryptography Implementation in TypeScript
 * 
 * This file contains constant values used throughout the Kyber implementation.
 */

/**
 * ML-KEM (Kyber) Constants
 * 
 * This file contains the constants used in the Kyber algorithm
 * These are set for Kyber-768 (k=3) which provides 128-bit post-quantum security
 */

// Algorithm parameters
export const KYBER_K = 3;               // Parameter for Kyber-768 (use 2 for Kyber-512, 4 for Kyber-1024)
export const KYBER_N = 256;             // Ring dimension
export const KYBER_Q = 3329;            // Modulus
export const KYBER_ETA1 = 2;            // Noise parameter
export const KYBER_ETA2 = 2;            // Noise parameter for Kyber-768
export const KYBER_DU = 10;             // Compression parameter
export const KYBER_DV = 4;              // Compression parameter
export const KYBER_SYMBYTES = 32;       // Size of shared key
export const KYBER_POLYBYTES = 384;     // Size of serialized polynomial
export const KYBER_POLYVECBYTES = KYBER_K * KYBER_POLYBYTES;  // Size of serialized vector of polynomials

// Montgomery factor for fast modular reduction
export const KYBER_MONT_FACTOR = 62209; // 2^16 % q

// Type definitions
export type Poly = Int16Array;          // Polynomial with coefficients in Z_q
export type PolyVec = Poly[];           // Vector of polynomials
export type Bytes = Uint8Array;         // Byte array
