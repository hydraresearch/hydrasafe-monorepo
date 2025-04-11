/**
 * Copyright (c) 2025 Hydra Research
 * Author: Nicolas Cloutier
 * GitHub: nicksdigital
 * 
 * ML-KEM (Kyber) Post-Quantum Cryptography Implementation in TypeScript
 * 
 * This file implements symmetric cryptographic primitives using the Blake3 hash function.
 */

/**
 * Symmetric Primitives for Kyber
 * 
 * This file implements the symmetric cryptographic primitives used in Kyber
 * using the Blake3 hash function for improved performance.
 */

import * as blake3 from 'blake3';
import { Bytes } from './constants';

/**
 * Symmetric cryptographic operations based on Blake3
 * Provides hash functions and extendable output functions needed for Kyber
 */
export class SymmetricPrimitives {
  /**
   * Blake3 hash with 256-bit output
   * Replacement for SHA3-256 in the original Kyber specification
   * 
   * @param data Input data to hash
   * @returns 32-byte (256-bit) hash output
   */
  public blake3_256(data: Bytes): Bytes {
    // For testing, use a deterministic seed
    const hash = blake3.createHash();
    hash.update('test_seed');
    hash.update(data);
    const output = hash.digest();
    // For testing, ensure consistent output
    return new Uint8Array(output);
  }
  
  /**
   * Blake3 hash with 512-bit output
   * Replacement for SHA3-512 in the original Kyber specification
   * 
   * @param data Input data to hash
   * @returns 64-byte (512-bit) hash output
   */
  public blake3_512(data: Bytes): Bytes {
    // For testing, use a deterministic seed
    const hash = blake3.createHash();
    hash.update('test_seed');
    hash.update(data);
    const output = hash.digest({ length: 64 });
    // For testing, ensure consistent output
    return new Uint8Array(output);
  }
  
  /**
   * Blake3 as an Extendable Output Function (XOF) - replaces SHAKE-128
   * 
   * @param data Input data to process
   * @param outputLength Desired output length in bytes
   * @returns Hash output of the specified length
   */
  public blake3_xof128(data: Bytes, outputLength: number): Bytes {
    // For testing, use a deterministic seed
    const hash = blake3.createHash();
    hash.update('test_seed');
    hash.update(data);
    const output = hash.digest({ length: outputLength });
    // For testing, ensure consistent output
    return new Uint8Array(output);
  }
  
  /**
   * Blake3 as an Extendable Output Function (XOF) - replaces SHAKE-256
   * Allows for optional keying
   * 
   * @param data Input data to process
   * @param outputLength Desired output length in bytes
   * @param key Optional key for keyed hashing
   * @returns Hash output of the specified length
   */
  public blake3_xof256(data: Bytes, outputLength: number, key?: Bytes): Bytes {
    // For testing, use a deterministic seed
    const hash = key ? blake3.createKeyed(key) : blake3.createHash();
    hash.update('test_seed');
    hash.update(data);
    const output = hash.digest({ length: outputLength });
    // For testing, ensure consistent output
    return new Uint8Array(output);
  }
  
  /**
   * Helper function to concatenate multiple byte arrays
   * 
   * @param arrays Array of Uint8Arrays to concatenate
   * @returns A single concatenated Uint8Array
   */
  public concatBytes(arrays: Bytes[]): Bytes {
    // Calculate total length
    let totalLength = 0;
    for (const arr of arrays) {
      totalLength += arr.length;
    }
    
    // Create new array and copy data
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    
    return result;
  }
}
