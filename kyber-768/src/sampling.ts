/**
 * Copyright (c) 2025 Hydra Research
 * Author: Nicolas Cloutier
 * GitHub: nicksdigital
 * 
 * ML-KEM (Kyber) Post-Quantum Cryptography Implementation in TypeScript
 * 
 * This file implements polynomial sampling operations used in the Kyber algorithm.
 */

/**
 * Sampling Functions for Kyber
 * 
 * This file contains functions for sampling polynomials and generating matrices
 * needed for the Kyber algorithm.
 */

import { KYBER_K, KYBER_N, KYBER_Q, Poly, PolyVec, Bytes } from './constants';
import { SymmetricPrimitives } from './symmetric';

/**
 * Sampling operations for Kyber
 */
export class Sampling {
  private symmetric: SymmetricPrimitives;
  
  constructor() {
    this.symmetric = new SymmetricPrimitives();
  }
  
  /**
   * Generate a polynomial with small coefficients using
   * a centered binomial distribution (CBD)
   * 
   * @param seed Seed for randomness
   * @param nonce Nonce to ensure different outputs from the same seed
   * @param eta Noise parameter that determines the distribution width
   * @returns Polynomial with small coefficients
   */
  public genNoisePoly(seed: Bytes, nonce: number, eta: number): Poly {
    const poly = new Int16Array(KYBER_N);
    const buf = this.symmetric.blake3_xof256(
      this.symmetric.concatBytes([seed, new Uint8Array([nonce])]), 
      KYBER_N * eta
    );
    
    for (let i = 0; i < KYBER_N; i++) {
      // CBD: Centered Binomial Distribution
      let t = 0;
      for (let j = 0; j < eta; j++) {
        const a = (buf[i * eta + j] >> 0) & 1;
        const b = (buf[i * eta + j] >> 1) & 1;
        t += a - b;
      }
      poly[i] = t;
    }
    
    return poly;
  }
  
  /**
   * Sample a polynomial deterministically from a seed
   * using rejection sampling for uniform distribution mod q
   * 
   * @param seed Seed for randomness
   * @param nonce Nonce to ensure different outputs from the same seed
   * @returns Uniformly random polynomial with coefficients in [0, q-1]
   */
  public samplePoly(seed: Bytes, nonce: number): Poly {
    const poly = new Int16Array(KYBER_N);
    const buf = this.symmetric.blake3_xof128(
      this.symmetric.concatBytes([seed, new Uint8Array([nonce & 0xff, (nonce >> 8) & 0xff])]), 
      KYBER_N * 3
    );
    
    let i = 0;
    let j = 0;
    
    while (i < KYBER_N && j + 3 <= buf.length) {
      // Parse 3 bytes into 2 coefficients (12 bits each)
      const val1 = ((buf[j] & 0xff) | ((buf[j + 1] & 0x0f) << 8));
      const val2 = (((buf[j + 1] & 0xff) >> 4) | ((buf[j + 2] & 0xff) << 4));
      
      // Rejection sampling for uniform distribution
      if (val1 < KYBER_Q) {
        poly[i++] = val1;
      }
      
      if (i < KYBER_N && val2 < KYBER_Q) {
        poly[i++] = val2;
      }
      
      j += 3;
    }
    
    return poly;
  }
  
  /**
   * Generate a matrix A deterministically from a seed
   * A is a matrix of polynomials used in the Kyber scheme
   * 
   * @param seed 32-byte seed for matrix generation
   * @param transposed Whether to generate A or A^T
   * @returns Matrix A or A^T (in NTT domain)
   */
  public generateMatrix(seed: Bytes, transposed: boolean = false): PolyVec[] {
    const matrix: PolyVec[] = [];
    
    for (let i = 0; i < KYBER_K; i++) {
      matrix[i] = [];
      for (let j = 0; j < KYBER_K; j++) {
        // Derive nonce from indices (transposing if requested)
        const nonce = transposed ? (j << 8) + i : (i << 8) + j;
        
        // Sample uniform polynomial
        matrix[i][j] = this.samplePoly(seed, nonce);
      }
    }
    
    return matrix;
  }
}
