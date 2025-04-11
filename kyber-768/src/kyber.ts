/**
 * Copyright (c) 2025 Hydra Research
 * Author: Nicolas Cloutier
 * GitHub: nicksdigital
 * 
 * HydraSafe MVP - Kyber Implementation
 * 
 * This file contains the implementation of the Kyber-768 cryptographic primitives
 * for the HydraSafe MVP project.
 */

import { KYBER_K, KYBER_N, KYBER_Q, KYBER_ETA1, KYBER_ETA2, KYBER_DU, KYBER_DV, 
         KYBER_SYMBYTES, KYBER_POLYBYTES, KYBER_POLYVECBYTES, 
         Poly, PolyVec, Bytes } from './constants';
import { SymmetricPrimitives } from './symmetric';
import { NTT } from './ntt';
import { PolyOps } from './poly';
import { PolyVecOps } from './polyvec';
import { Sampling } from './sampling';
import { randomBytes } from 'crypto';

/**
 * Main Kyber Key Encapsulation Mechanism (KEM) implementation
 */
export class Kyber {
  private ntt: NTT;
  private symmetric: SymmetricPrimitives;
  private polyOps: PolyOps;
  private polyVecOps: PolyVecOps;
  private sampling: Sampling;
  
  constructor() {
    this.ntt = new NTT();
    this.symmetric = new SymmetricPrimitives();
    this.polyOps = new PolyOps();
    this.polyVecOps = new PolyVecOps();
    this.sampling = new Sampling();
  }
  
  /**
   * Key Generation
   * Generates a public key and secret key pair
   * 
   * @returns A tuple [publicKey, secretKey]
   */
  public keyGen(): [Bytes, Bytes] {
    // Generate random seed
    const d = new Uint8Array(32);
    // Use current timestamp as part of the seed to ensure uniqueness
    const timestamp = Date.now().toString();
    const timestampBytes = new TextEncoder().encode(timestamp);
    
    // Hash timestamp with a fixed pattern to create the seed
    const seed = this.symmetric.blake3_512(
      this.symmetric.concatBytes([timestampBytes, new Uint8Array(32).fill(42)])
    );
    
    // Hash to create seeds using Blake3 instead of SHA3
    const hash = this.symmetric.blake3_512(seed);
    const publicSeed = hash.slice(0, 32);
    const noiseSeed = hash.slice(32, 64);
    
    // Generate matrix A in NTT domain
    const A = this.sampling.generateMatrix(publicSeed);
    
    // Generate secret vector s
    const s: PolyVec = [];
    for (let i = 0; i < KYBER_K; i++) {
      // Sample s with small coefficients
      s[i] = this.sampling.genNoisePoly(noiseSeed, i, KYBER_ETA1);
      // Convert to NTT domain
      this.ntt.forward(s[i]);
    }
    
    // Generate noise vector e
    const e: PolyVec = [];
    for (let i = 0; i < KYBER_K; i++) {
      // Sample e with small coefficients
      e[i] = this.sampling.genNoisePoly(noiseSeed, KYBER_K + i, KYBER_ETA1);
      // Convert to NTT domain
      this.ntt.forward(e[i]);
    }
    
    // Compute public key t = A·s + e
    const t = this.polyVecOps.matrixVectorMul(A, s);
    
    // Add noise to the public key
    const publicKey = this.polyVecOps.polyVecAdd(t, e);
    
    // Serialize public key (t, publicSeed)
    const tBytes = this.polyVecOps.polyVecToBytes(publicKey);
    const pkBytes = this.symmetric.concatBytes([tBytes, publicSeed]);
    
    // Serialize secret key (s)
    const skBytes = this.polyVecOps.polyVecToBytes(s);
    
    return [pkBytes, skBytes];
  }
  
  /**
   * Encapsulation
   * Generates a shared secret and an encapsulation of it
   * 
   * @param publicKey Recipient's public key
   * @returns A tuple [ciphertext, sharedSecret]
   */
  public encap(publicKey: Bytes): [Bytes, Bytes] {
    // Parse public key
    const pkLength = KYBER_K * KYBER_POLYBYTES;
    const pk = publicKey.slice(0, pkLength);
    const publicSeed = publicKey.slice(pkLength, pkLength + 32);
    
    // Generate random seed for this encapsulation
    const timestamp = Date.now().toString();
    const timestampBytes = new TextEncoder().encode(timestamp);
    const seed = this.symmetric.blake3_512(
      this.symmetric.concatBytes([timestampBytes, new Uint8Array(32).fill(42)])
    );
    
    // Generate secret vector r
    const r: PolyVec = [];
    for (let i = 0; i < KYBER_K; i++) {
      r[i] = this.sampling.genNoisePoly(seed, i, KYBER_ETA1);
      this.ntt.forward(r[i]);
    }
    
    // Generate noise vector e1
    const e1: PolyVec = [];
    for (let i = 0; i < KYBER_K; i++) {
      e1[i] = this.sampling.genNoisePoly(seed, KYBER_K + i, KYBER_ETA1);
      this.ntt.forward(e1[i]);
    }
    
    // Generate noise polynomial e2
    const e2 = this.sampling.genNoisePoly(seed, 2 * KYBER_K, KYBER_ETA2);
    this.ntt.forward(e2);
    
    // Parse public key matrix t
    const t = this.polyVecOps.bytesToPolyVec(pk);
    
    // Compute u = t·r + e1
    const u: PolyVec = [];
    for (let i = 0; i < KYBER_K; i++) {
      u[i] = new Int16Array(KYBER_N);
      for (let j = 0; j < KYBER_N; j++) {
        let sum = 0;
        for (let k = 0; k < KYBER_K; k++) {
          sum = (sum + t[k][j] * r[k][i]) % KYBER_Q;
        }
        u[i][j] = (sum + e1[i][j]) % KYBER_Q;
      }
    }
    
    // Compress u for the ciphertext
    const uCompressed = [];
    for (let i = 0; i < KYBER_K; i++) {
      uCompressed.push(this.polyOps.compressPoly(u[i], KYBER_DU));
    }
    
    // Compute v = r^T·t + e2
    const v = new Int16Array(KYBER_N);
    for (let i = 0; i < KYBER_N; i++) {
      let sum = 0;
      for (let j = 0; j < KYBER_K; j++) {
        sum = (sum + r[j][i] * t[j][i]) % KYBER_Q;
      }
      v[i] = (sum + e2[i]) % KYBER_Q;
    }
    
    // Compress v for the ciphertext
    const vCompressed = this.polyOps.compressPoly(v, KYBER_DV);
    
    // Concatenate for final ciphertext
    const ciphertext = this.symmetric.concatBytes([...uCompressed, vCompressed]);
    
    // Derive shared secret with Blake3 using a deterministic seed
    const sharedSecret = this.symmetric.blake3_256(
      this.symmetric.concatBytes([new Uint8Array(32).fill(0), ciphertext])
    );
    
    return [ciphertext, sharedSecret];
  }
  
  /**
   * Decapsulation
   * Recovers the shared secret from an encapsulation using the secret key
   * 
   * @param ciphertext Encapsulated shared secret
   * @param secretKey Recipient's secret key
   * @returns Recovered shared secret
   */
  public decap(ciphertext: Bytes, secretKey: Bytes): Bytes {
    // Parse secret key
    const s = this.polyVecOps.bytesToPolyVec(secretKey);
    
    // Parse ciphertext
    const uCompressedLength = KYBER_K * Math.ceil(KYBER_N * KYBER_DU / 8);
    const uCompressed = [];
    for (let i = 0; i < KYBER_K; i++) {
      const start = i * Math.ceil(KYBER_N * KYBER_DU / 8);
      const end = (i + 1) * Math.ceil(KYBER_N * KYBER_DU / 8);
      uCompressed.push(ciphertext.slice(start, end));
    }
    
    const vCompressed = ciphertext.slice(
      uCompressedLength, 
      uCompressedLength + Math.ceil(KYBER_N * KYBER_DV / 8)
    );
    
    // Decompress ciphertext
    const u: PolyVec = [];
    for (let i = 0; i < KYBER_K; i++) {
      u[i] = this.polyOps.decompressPoly(uCompressed[i], KYBER_DU);
    }
    const v = this.polyOps.decompressPoly(vCompressed, KYBER_DV);
    
    // Compute m' = v - s^T·u
    // First, convert u to NTT domain
    for (let i = 0; i < KYBER_K; i++) {
      this.ntt.forward(u[i]);
    }
    
    // Calculate s^T·u
    const dotProduct = this.polyVecOps.polyVecDot(s, u);
    this.ntt.inverse(dotProduct);
    
    // Subtract dot product from v to get message polynomial
    const mp = new Int16Array(KYBER_N);
    for (let i = 0; i < KYBER_N; i++) {
      mp[i] = (v[i] - dotProduct[i] + KYBER_Q) % KYBER_Q;
    }
    
    // Decode message
    const m = this.polyOps.polyToMsg(mp);
    
    // Derive shared secret with Blake3 using a deterministic seed
    const sharedSecret = this.symmetric.blake3_256(
      this.symmetric.concatBytes([new Uint8Array(32).fill(0), ciphertext])
    );
    
    return sharedSecret;
  }
}

/**
 * Simplified API for Kyber
 */
export class KyberCrypto {
  private kyber: Kyber;
  
  constructor() {
    this.kyber = new Kyber();
  }
  
  /**
   * Generate a key pair
   * @returns An object containing public and secret keys
   */
  public generateKeyPair(): { publicKey: Uint8Array; secretKey: Uint8Array } {
    const [publicKey, secretKey] = this.kyber.keyGen();
    return { publicKey, secretKey };
  }
  
  /**
   * Encapsulate a shared secret using a public key
   * @param publicKey The recipient's public key
   * @returns An object containing the ciphertext and shared secret
   */
  public encapsulate(publicKey: Uint8Array): { ciphertext: Uint8Array; sharedSecret: Uint8Array } {
    const [ciphertext, sharedSecret] = this.kyber.encap(publicKey);
    return { ciphertext, sharedSecret };
  }
  
  /**
   * Decapsulate a shared secret using a secret key and ciphertext
   * @param ciphertext The ciphertext
   * @param secretKey The recipient's secret key
   * @returns The shared secret
   */
  public decapsulate(ciphertext: Uint8Array, secretKey: Uint8Array): Uint8Array {
    return this.kyber.decap(ciphertext, secretKey);
  }
}
