/**
 * Copyright (c) 2025 Hydra Research
 * Author: Nicolas Cloutier
 * GitHub: nicksdigital
 * 
 * ML-KEM (Kyber) Post-Quantum Cryptography Implementation in TypeScript
 * 
 * This file implements polynomial operations used in the Kyber algorithm.
 */

/**
 * Polynomial Operations for Kyber
 * 
 * This file contains operations for polynomial manipulation,
 * including serialization, compression, and mathematical operations.
 */

import { KYBER_N, KYBER_Q, KYBER_POLYBYTES, Poly, Bytes } from './constants';
import { NTT } from './ntt';

/**
 * Helper class for polynomial operations
 */
export class PolyOps {
  private ntt: NTT;
  
  constructor() {
    this.ntt = new NTT();
  }
  
  /**
   * Compress a polynomial with d bits per coefficient
   * 
   * @param poly Polynomial to compress
   * @param d Number of bits to use for each coefficient
   * @returns Compressed representation as a byte array
   */
  public compressPoly(poly: Poly, d: number): Bytes {
    const compressedPoly = new Uint8Array(Math.ceil(KYBER_N * d / 8));
    const mask = (1 << d) - 1;
    
    for (let i = 0; i < KYBER_N; i++) {
      // Center and compress
      const t = Math.floor(((poly[i] << d) + (KYBER_Q / 2)) / KYBER_Q) & mask;
      
      // Pack into bytes
      const bytePos = Math.floor(i * d / 8);
      const bitPos = (i * d) % 8;
      
      compressedPoly[bytePos] |= (t << bitPos) & 0xff;
      if (bitPos + d > 8) {
        compressedPoly[bytePos + 1] |= (t >> (8 - bitPos)) & 0xff;
      }
    }
    
    return compressedPoly;
  }
  
  /**
   * Decompress a polynomial from its compressed representation
   * 
   * @param compressedPoly Compressed polynomial as a byte array
   * @param d Number of bits used for each coefficient
   * @returns Decompressed polynomial
   */
  public decompressPoly(compressedPoly: Bytes, d: number): Poly {
    const poly = new Int16Array(KYBER_N);
    const mask = (1 << d) - 1;
    
    for (let i = 0; i < KYBER_N; i++) {
      // Extract bits from packed bytes
      const bytePos = Math.floor(i * d / 8);
      const bitPos = (i * d) % 8;
      
      let t = (compressedPoly[bytePos] >> bitPos) & mask;
      if (bitPos + d > 8) {
        t |= (compressedPoly[bytePos + 1] << (8 - bitPos)) & mask;
      }
      
      // Decompress
      poly[i] = Math.round((t * KYBER_Q) / (1 << d)) % KYBER_Q;
    }
    
    return poly;
  }
  
  /**
   * Serialize a polynomial to bytes
   * 
   * @param poly Polynomial to serialize
   * @returns Serialized polynomial as a byte array
   */
  public polyToBytes(poly: Poly): Bytes {
    const bytes = new Uint8Array(KYBER_POLYBYTES);
    
    for (let i = 0; i < KYBER_N / 2; i++) {
      // Pack two coefficients into 3 bytes
      const t0 = poly[2 * i] % KYBER_Q;
      const t1 = poly[2 * i + 1] % KYBER_Q;
      
      bytes[3 * i] = t0 & 0xff;
      bytes[3 * i + 1] = (t0 >> 8) | ((t1 & 0x0f) << 4);
      bytes[3 * i + 2] = t1 >> 4;
    }
    
    return bytes;
  }
  
  /**
   * Deserialize a polynomial from bytes
   * 
   * @param bytes Serialized polynomial as a byte array
   * @returns Deserialized polynomial
   */
  public bytesToPoly(bytes: Bytes): Poly {
    const poly = new Int16Array(KYBER_N);
    
    for (let i = 0; i < KYBER_N / 2; i++) {
      // Unpack two coefficients from 3 bytes
      poly[2 * i] = (bytes[3 * i] | ((bytes[3 * i + 1] & 0x0f) << 8));
      poly[2 * i + 1] = ((bytes[3 * i + 1] >> 4) | (bytes[3 * i + 2] << 4));
    }
    
    return poly;
  }
  
  /**
   * Decode a message into a polynomial
   * Each bit of the message becomes a coefficient that's either 0 or q/2
   * 
   * @param msg 32-byte message
   * @returns Polynomial representation of the message
   */
  public polyFromMsg(msg: Bytes): Poly {
    const poly = new Int16Array(KYBER_N);
    
    for (let i = 0; i < 32; i++) {
      for (let j = 0; j < 8; j++) {
        if ((msg[i] >> j) & 1) {
          poly[8 * i + j] = Math.floor(KYBER_Q / 2);
        }
      }
    }
    
    return poly;
  }
  
  /**
   * Encode a polynomial back to a message
   * Coefficients close to q/2 become 1, others become 0
   * 
   * @param poly Polynomial to encode
   * @returns 32-byte message
   */
  public polyToMsg(poly: Poly): Bytes {
    const msg = new Uint8Array(32);
    
    for (let i = 0; i < 32; i++) {
      msg[i] = 0;
      for (let j = 0; j < 8; j++) {
        if (Math.abs(poly[8 * i + j] - Math.floor(KYBER_Q / 2)) < Math.floor(KYBER_Q / 4)) {
          msg[i] |= 1 << j;
        }
      }
    }
    
    return msg;
  }
  
  /**
   * Add two polynomials
   * 
   * @param a First polynomial
   * @param b Second polynomial
   * @returns a + b
   */
  public add(a: Poly, b: Poly): Poly {
    const result = new Int16Array(KYBER_N);
    
    for (let i = 0; i < KYBER_N; i++) {
      result[i] = (a[i] + b[i]) % KYBER_Q;
    }
    
    return result;
  }
  
  /**
   * Subtract one polynomial from another
   * 
   * @param a First polynomial
   * @param b Second polynomial
   * @returns a - b
   */
  public subtract(a: Poly, b: Poly): Poly {
    const result = new Int16Array(KYBER_N);
    
    for (let i = 0; i < KYBER_N; i++) {
      result[i] = (a[i] - b[i] + KYBER_Q) % KYBER_Q;
    }
    
    return result;
  }
  
  /**
   * Multiply two polynomials in the NTT domain
   * 
   * @param a First polynomial (in NTT domain)
   * @param b Second polynomial (in NTT domain)
   * @returns a * b (in NTT domain)
   */
  public multiply(a: Poly, b: Poly): Poly {
    return this.ntt.polyMul(a, b);
  }
  
  /**
   * Apply forward NTT to a polynomial
   * 
   * @param poly Polynomial in normal domain
   * @returns Polynomial in NTT domain
   */
  public toNTT(poly: Poly): Poly {
    const result = new Int16Array(poly);
    this.ntt.forward(result);
    return result;
  }
  
  /**
   * Apply inverse NTT to a polynomial
   * 
   * @param poly Polynomial in NTT domain
   * @returns Polynomial in normal domain
   */
  public fromNTT(poly: Poly): Poly {
    const result = new Int16Array(poly);
    this.ntt.inverse(result);
    return result;
  }
}
