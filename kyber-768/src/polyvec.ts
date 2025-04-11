/**
 * Copyright (c) 2025 Hydra Research
 * Author: Nicolas Cloutier
 * GitHub: nicksdigital
 * 
 * ML-KEM (Kyber) Post-Quantum Cryptography Implementation in TypeScript
 * 
 * This file implements vector operations for polynomials used in the Kyber algorithm.
 */

/**
 * Polynomial Vector Operations for Kyber
 * 
 * This file contains operations for vectors of polynomials,
 * including serialization and mathematical operations.
 */

import { KYBER_K, KYBER_N, KYBER_Q, KYBER_POLYBYTES, KYBER_POLYVECBYTES, Poly, PolyVec, Bytes } from './constants';
import { PolyOps } from './poly';
import { SymmetricPrimitives } from './symmetric';

/**
 * Helper class for polynomial vector operations
 */
export class PolyVecOps {
  private polyOps: PolyOps;
  private symmetric: SymmetricPrimitives;
  
  constructor() {
    this.polyOps = new PolyOps();
    this.symmetric = new SymmetricPrimitives();
  }
  
  /**
   * Serialize a vector of polynomials
   * 
   * @param polyVec Vector of polynomials to serialize
   * @returns Serialized vector as a byte array
   */
  public polyVecToBytes(polyVec: PolyVec): Bytes {
    const bytes: Bytes[] = [];
    
    for (let i = 0; i < polyVec.length; i++) {
      bytes.push(this.polyOps.polyToBytes(polyVec[i]));
    }
    
    return this.symmetric.concatBytes(bytes);
  }
  
  /**
   * Deserialize a vector of polynomials
   * 
   * @param bytes Serialized vector as a byte array
   * @returns Deserialized vector of polynomials
   */
  public bytesToPolyVec(bytes: Bytes): PolyVec {
    const polyVec: PolyVec = [];
    
    for (let i = 0; i < KYBER_K; i++) {
      const start = i * KYBER_POLYBYTES;
      const end = (i + 1) * KYBER_POLYBYTES;
      polyVec.push(this.polyOps.bytesToPoly(bytes.slice(start, end)));
    }
    
    return polyVec;
  }
  
  /**
   * Compute the inner product of two polynomial vectors
   * 
   * @param a First vector of polynomials (in NTT domain)
   * @param b Second vector of polynomials (in NTT domain)
   * @returns Inner product polynomial (in NTT domain)
   */
  public polyVecDot(a: PolyVec, b: PolyVec): Poly {
    const result = new Int16Array(KYBER_N).fill(0);
    
    for (let i = 0; i < KYBER_K; i++) {
      const t = this.polyOps.multiply(a[i], b[i]);
      for (let j = 0; j < KYBER_N; j++) {
        result[j] = (result[j] + t[j]) % KYBER_Q;
      }
    }
    
    return result;
  }
  
  /**
   * Matrix-vector multiplication
   * 
   * @param matrix Matrix of polynomials (in NTT domain)
   * @param vector Vector of polynomials (in NTT domain)
   * @returns Resulting vector (in NTT domain)
   */
  public matrixVectorMul(matrix: PolyVec[], vector: PolyVec): PolyVec {
    const result: PolyVec = [];
    
    for (let i = 0; i < KYBER_K; i++) {
      result[i] = new Int16Array(KYBER_N).fill(0);
      
      for (let j = 0; j < KYBER_K; j++) {
        const temp = this.polyOps.multiply(matrix[i][j], vector[j]);
        for (let k = 0; k < KYBER_N; k++) {
          result[i][k] = (result[i][k] + temp[k]) % KYBER_Q;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Transpose of matrix-vector multiplication
   * 
   * @param matrix Matrix of polynomials (in NTT domain)
   * @param vector Vector of polynomials (in NTT domain)
   * @returns Resulting vector (in NTT domain)
   */
  public matrixVectorMulTranspose(matrix: PolyVec[], vector: PolyVec): PolyVec {
    const result: PolyVec = [];
    
    for (let i = 0; i < KYBER_K; i++) {
      result[i] = new Int16Array(KYBER_N).fill(0);
      
      for (let j = 0; j < KYBER_K; j++) {
        const temp = this.polyOps.multiply(matrix[j][i], vector[j]);
        for (let k = 0; k < KYBER_N; k++) {
          result[i][k] = (result[i][k] + temp[k]) % KYBER_Q;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Add two polynomial vectors
   * 
   * @param a First vector of polynomials
   * @param b Second vector of polynomials
   * @returns a + b
   */
  public polyVecAdd(a: PolyVec, b: PolyVec): PolyVec {
    const result: PolyVec = [];
    
    for (let i = 0; i < a.length; i++) {
      result.push(this.polyOps.add(a[i], b[i]));
    }
    
    return result;
  }
  
  /**
   * Convert a vector of polynomials to NTT domain
   * 
   * @param polyVec Vector of polynomials in normal domain
   * @returns Vector of polynomials in NTT domain
   */
  public polyVecToNTT(polyVec: PolyVec): PolyVec {
    const result: PolyVec = [];
    
    for (let i = 0; i < polyVec.length; i++) {
      result.push(this.polyOps.toNTT(polyVec[i]));
    }
    
    return result;
  }
  
  /**
   * Convert a vector of polynomials from NTT domain
   * 
   * @param polyVec Vector of polynomials in NTT domain
   * @returns Vector of polynomials in normal domain
   */
  public polyVecFromNTT(polyVec: PolyVec): PolyVec {
    const result: PolyVec = [];
    
    for (let i = 0; i < polyVec.length; i++) {
      result.push(this.polyOps.fromNTT(polyVec[i]));
    }
    
    return result;
  }
}
