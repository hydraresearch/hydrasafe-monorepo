/**
 * Copyright (c) 2025 Hydra Research
 * Author: Nicolas Cloutier
 * GitHub: nicksdigital
 * 
 * ML-KEM (Kyber) Post-Quantum Cryptography Implementation in TypeScript
 * 
 * This file implements the Number Theoretic Transform (NTT) used in polynomial operations.
 */

/**
 * Number Theoretic Transform (NTT) Implementation
 * 
 * This file contains the implementation of NTT operations used in Kyber
 * for polynomial multiplication. NTT is a variant of the Fast Fourier Transform
 * that works in finite fields, which allows for efficient polynomial operations.
 */

import { KYBER_N, KYBER_Q, KYBER_MONT_FACTOR, Poly } from './constants';

/**
 * Fast Number Theoretic Transform (NTT) implementation
 * This is a critical component for the performance of the algorithm
 */
export class NTT {
  private zetas: Int16Array;
  private zetasInv: Int16Array;
  
  constructor() {
    // Pre-computed roots of unity in Z_q (NTT constants)
    this.zetas = new Int16Array([
      2285, 2571, 2970, 1812, 1493, 1422, 287, 202, 3158, 622, 1577, 182, 962, 
      2127, 1855, 1468, 573, 2004, 264, 383, 2500, 1458, 1727, 3199, 2648, 1017, 
      732, 608, 1787, 411, 3124, 1758, 1223, 652, 2777, 1015, 2036, 1491, 3047, 
      1785, 516, 3321, 3009, 2663, 1711, 2167, 126, 1469, 2476, 3239, 3058, 830, 
      107, 1908, 3082, 2378, 2931, 961, 1821, 2604, 448, 2264, 677, 2054, 2226, 
      430, 555, 843, 2078, 871, 1550, 105, 422, 587, 177, 3094, 3038, 2869, 1574, 
      1653, 3083, 778, 1159, 3182, 2552, 1483, 2727, 1119, 1739, 644, 2457, 349, 
      418, 329, 3173, 3254, 817, 1097, 603, 610, 1322, 2044, 1864, 384, 2114, 
      3193, 1218, 1994, 2455, 220, 2142, 1670, 2144, 1799, 2051, 794, 1819, 
      2475, 2459, 478, 3221, 3021, 996, 991, 958, 1869, 1522, 1628
    ]);
    
    // Pre-computed inverse NTT constants
    this.zetasInv = new Int16Array([
      1701, 1807, 1460, 2371, 2338, 2333, 308, 108, 2851, 870, 854, 1510, 2535, 
      1278, 1530, 1185, 1659, 1187, 3109, 874, 1335, 2111, 136, 1215, 2945, 1465, 
      1285, 2007, 2719, 2726, 2232, 2512, 75, 156, 3000, 2911, 2980, 872, 2685, 
      1590, 2210, 602, 1846, 777, 147, 2170, 2551, 246, 1676, 1755, 460, 291, 
      235, 3152, 2742, 2907, 3224, 1779, 2458, 1251, 2486, 2774, 2899, 1103, 
      1275, 2652, 1065, 2881, 725, 1508, 2368, 398, 951, 247, 1421, 3222, 2499, 
      271, 90, 853, 1860, 3203, 1162, 1618, 666, 320, 8, 2813, 1544, 282, 1838, 
      1293, 2314, 552, 2677, 2106, 1571, 205, 2918, 1542, 2721, 2597, 2312, 681, 
      130, 1602, 1871, 829, 2946, 3065, 1325, 2756, 1861, 1474, 1202, 2367, 3147, 
      1752, 2707, 171, 3127, 3042, 1907, 1836, 1517, 359, 758, 1441
    ]);
  }
  
  /**
   * Forward Number Theoretic Transform
   * Converts polynomial from normal domain to NTT domain
   * 
   * @param r Polynomial to transform (modified in-place)
   */
  public forward(r: Poly): void {
    let j = 0;
    let k = 1;
    let len = 128;
    
    while (len > 1) {
      for (let start = 0; start < KYBER_N; start = j + len) {
        const zeta = this.zetas[k++];
        for (j = start; j < start + len; j++) {
          const t = this.mulMod(zeta, r[j + len]);
          r[j + len] = this.subMod(r[j], t);
          r[j] = this.addMod(r[j], t);
        }
      }
      len >>= 1;
    }
  }
  
  /**
   * Inverse Number Theoretic Transform
   * Converts polynomial from NTT domain to normal domain
   * 
   * @param r Polynomial to transform (modified in-place)
   */
  public inverse(r: Poly): void {
    let j = 0;
    let k = 127;
    let len = 2;
    
    while (len < KYBER_N) {
      for (let start = 0; start < KYBER_N; start = j + len) {
        const zeta = this.zetasInv[k--];
        for (j = start; j < start + len; j++) {
          const t = r[j];
          r[j] = this.addMod(t, r[j + len]);
          r[j + len] = this.mulMod(zeta, this.subMod(r[j + len], t));
        }
      }
      len <<= 1;
    }
    
    // Multiply by n^-1 mod q
    for (let i = 0; i < KYBER_N; i++) {
      r[i] = this.mulMod(r[i], 3303); // 3303 = 256^-1 mod 3329
    }
  }
  
  /**
   * Addition modulo q
   */
  public addMod(a: number, b: number): number {
    return (a + b) % KYBER_Q;
  }
  
  /**
   * Subtraction modulo q
   */
  public subMod(a: number, b: number): number {
    return (a - b + KYBER_Q) % KYBER_Q;
  }
  
  /**
   * Multiplication modulo q using Montgomery reduction for speed
   * 
   * @param a First operand
   * @param b Second operand
   * @returns (a * b) mod q
   */
  public mulMod(a: number, b: number): number {
    const r = (a * b) % KYBER_Q;
    
    // Montgomery reduction (optimized)
    const t = (r * KYBER_MONT_FACTOR) & 0xffff;
    const u = (t * KYBER_Q) >> 16;
    const v = r + u;
    return v >= KYBER_Q ? v - KYBER_Q : v;
  }
  
  /**
   * Polynomial point-wise multiplication in the NTT domain
   * 
   * @param a First polynomial (in NTT domain)
   * @param b Second polynomial (in NTT domain)
   * @returns Result of a*b (in NTT domain)
   */
  public polyMul(a: Poly, b: Poly): Poly {
    const c = new Int16Array(KYBER_N);
    
    // Multiply in the NTT domain (coefficient-wise)
    for (let i = 0; i < KYBER_N; i++) {
      c[i] = this.mulMod(a[i], b[i]);
    }
    
    return c;
  }
  
  /**
   * Barrett reduction - ensures coefficients are properly reduced modulo q
   * 
   * @param r Polynomial to reduce
   * @returns Reduced polynomial
   */
  public reduce(r: Poly): Poly {
    for (let i = 0; i < KYBER_N; i++) {
      r[i] = this.barrett(r[i]);
    }
    
    return r;
  }
  
  /**
   * Barrett reduction for a single value
   * 
   * @param a Value to reduce
   * @returns a mod q
   */
  private barrett(a: number): number {
    const v = ((1 << 24) + KYBER_Q / 2) / KYBER_Q;
    const t = Math.floor(v * a / (1 << 24));
    return a - t * KYBER_Q;
  }
}
