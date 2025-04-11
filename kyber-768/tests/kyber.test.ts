/**
 * Copyright (c) 2025 Hydra Research
 * Author: Nicolas Cloutier
 * GitHub: nicksdigital
 * 
 * HydraSafe MVP - Kyber Implementation Tests
 * 
 * This file contains the test suite for the Kyber-768 cryptographic implementation
 * in the HydraSafe MVP project.
 */

import { KyberCrypto } from '../src/kyber';
import { randomBytes } from 'crypto';

describe('Kyber', () => {
  let kyber: KyberCrypto;
  
  beforeEach(() => {
    kyber = new KyberCrypto();
    // For testing, use a fixed seed for random number generation
    const seed = new Uint8Array(32).fill(0);
    for (let i = 0; i < 32; i++) {
      seed[i] = i % 256;
    }
    // Set the seed for randomBytes
    randomBytes(32, (err, buf) => {
      if (err) throw err;
      buf.set(seed);
    });
  });
  
  test('should generate valid key pairs', () => {
    const { publicKey, secretKey } = kyber.generateKeyPair();
    
    // Check key sizes
    expect(publicKey).toBeInstanceOf(Uint8Array);
    expect(secretKey).toBeInstanceOf(Uint8Array);
    
    // For Kyber-768 (k=3):
    // Public key = k*384 + 32 = 1184 bytes
    // Secret key = k*384 = 1152 bytes
    expect(publicKey.length).toBe(1184);
    expect(secretKey.length).toBe(1152);
  });
  
  test('should successfully encapsulate and decapsulate', () => {
    // Generate keys
    const { publicKey, secretKey } = kyber.generateKeyPair();
    
    // Bob encapsulates a shared secret
    const { ciphertext, sharedSecret: bobSharedSecret } = kyber.encapsulate(publicKey);
    
    // Verify ciphertext size for Kyber-768:
    // Ciphertext = k*320 + 128 = 1088 bytes
    expect(ciphertext.length).toBe(1088);
    
    // Shared secret should be 32 bytes
    expect(bobSharedSecret.length).toBe(32);
    
    // Alice decapsulates the shared secret
    const aliceSharedSecret = kyber.decapsulate(ciphertext, secretKey);
    
    // Verify shared secret size
    expect(aliceSharedSecret.length).toBe(32);
    
    // Both shared secrets should match
    expect(Buffer.from(aliceSharedSecret).toString('hex'))
      .toEqual(Buffer.from(bobSharedSecret).toString('hex'));
  });
  
  test('should generate different key pairs on each call', () => {
    const { publicKey: pk1, secretKey: sk1 } = kyber.generateKeyPair();
    const { publicKey: pk2, secretKey: sk2 } = kyber.generateKeyPair();
    
    // Keys should be different
    expect(Buffer.from(pk1).toString('hex')).not.toEqual(Buffer.from(pk2).toString('hex'));
    expect(Buffer.from(sk1).toString('hex')).not.toEqual(Buffer.from(sk2).toString('hex'));
  });
  
  test('should generate different ciphertexts and shared secrets on each encapsulation', () => {
    const { publicKey } = kyber.generateKeyPair();
    
    const { ciphertext: c1, sharedSecret: ss1 } = kyber.encapsulate(publicKey);
    const { ciphertext: c2, sharedSecret: ss2 } = kyber.encapsulate(publicKey);
    
    // Ciphertexts and shared secrets should be different
    expect(Buffer.from(c1).toString('hex')).not.toEqual(Buffer.from(c2).toString('hex'));
    expect(Buffer.from(ss1).toString('hex')).not.toEqual(Buffer.from(ss2).toString('hex'));
  });
  
  test('should perform multiple encapsulation/decapsulation cycles', () => {
    const cycles = 5;
    
    for (let i = 0; i < cycles; i++) {
      // Generate keys
      const { publicKey, secretKey } = kyber.generateKeyPair();
      
      // Encapsulate
      const { ciphertext, sharedSecret: encapSecret } = kyber.encapsulate(publicKey);
      
      // Decapsulate
      const decapSecret = kyber.decapsulate(ciphertext, secretKey);
      
      // Verify secrets match
      expect(Buffer.from(encapSecret).toString('hex'))
        .toEqual(Buffer.from(decapSecret).toString('hex'));
    }
  });
  
  test('should detect tampered ciphertext', () => {
    // Generate keys
    const { publicKey, secretKey } = kyber.generateKeyPair();
    
    // Bob encapsulates a shared secret
    const { ciphertext, sharedSecret: originalSecret } = kyber.encapsulate(publicKey);
    
    // Tamper with the ciphertext (change a random byte)
    const tamperedCiphertext = Buffer.from(ciphertext);
    const randomPosition = Math.floor(Math.random() * tamperedCiphertext.length);
    tamperedCiphertext[randomPosition] = (tamperedCiphertext[randomPosition] + 1) % 256;
    
    // Alice decapsulates with tampered ciphertext
    const decapSecret = kyber.decapsulate(tamperedCiphertext, secretKey);
    
    // The decapsulated secret should be different from the original
    expect(Buffer.from(decapSecret).toString('hex'))
      .not.toEqual(Buffer.from(originalSecret).toString('hex'));
  });
  
  test('should handle cross-key pair operations correctly', () => {
    // Generate two key pairs
    const alice = kyber.generateKeyPair();
    const bob = kyber.generateKeyPair();
    
    // Bob encapsulates to Alice
    const { ciphertext: c1, sharedSecret: ss1 } = kyber.encapsulate(alice.publicKey);
    
    // Alice decapsulates
    const aliceSecret = kyber.decapsulate(c1, alice.secretKey);
    
    // Alice encapsulates to Bob
    const { ciphertext: c2, sharedSecret: ss2 } = kyber.encapsulate(bob.publicKey);
    
    // Bob decapsulates
    const bobSecret = kyber.decapsulate(c2, bob.secretKey);
    
    // Verify proper decapsulation
    expect(Buffer.from(ss1).toString('hex')).toEqual(Buffer.from(aliceSecret).toString('hex'));
    expect(Buffer.from(ss2).toString('hex')).toEqual(Buffer.from(bobSecret).toString('hex'));
    
    // Cross secrets should be different
    expect(Buffer.from(ss1).toString('hex')).not.toEqual(Buffer.from(ss2).toString('hex'));
  });
});
