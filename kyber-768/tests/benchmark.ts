/**
 * Copyright (c) 2025 Hydra Research
 * Author: Nicolas Cloutier
 * GitHub: nicksdigital
 * 
 * HydraSafe MVP - Kyber Performance Benchmark
 * 
 * This file contains performance benchmarks for the Kyber-768 cryptographic
 * implementation in the HydraSafe MVP project.
 */

import { KyberCrypto } from '../src/kyber';
import { performance } from 'perf_hooks';

const kyber = new KyberCrypto();
const iterations = 100;

function benchmarkKeyGen() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    kyber.generateKeyPair();
  }
  const end = performance.now();
  return (end - start) / iterations;
}

function benchmarkEncap() {
  const { publicKey } = kyber.generateKeyPair();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    kyber.encapsulate(publicKey);
  }
  const end = performance.now();
  return (end - start) / iterations;
}

function benchmarkDecap() {
  const { publicKey, secretKey } = kyber.generateKeyPair();
  const { ciphertext } = kyber.encapsulate(publicKey);
  
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    kyber.decapsulate(ciphertext, secretKey);
  }
  const end = performance.now();
  return (end - start) / iterations;
}

function benchmarkCrossEncapDecap() {
  const alice = kyber.generateKeyPair();
  const bob = kyber.generateKeyPair();
  
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const { ciphertext, sharedSecret: aliceSecret } = kyber.encapsulate(bob.publicKey);
    const bobSecret = kyber.decapsulate(ciphertext, bob.secretKey);
  }
  const end = performance.now();
  return (end - start) / iterations;
}

function benchmarkMultipleCycles() {
  const { publicKey, secretKey } = kyber.generateKeyPair();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const { ciphertext } = kyber.encapsulate(publicKey);
    kyber.decapsulate(ciphertext, secretKey);
  }
  const end = performance.now();
  return (end - start) / iterations;
}

function runBenchmark() {
  console.log(`Running ${iterations} iterations of each operation...`);
  
  const keyGenTime = benchmarkKeyGen();
  const encapTime = benchmarkEncap();
  const decapTime = benchmarkDecap();
  const crossTime = benchmarkCrossEncapDecap();
  const cycleTime = benchmarkMultipleCycles();
  
  console.log('\nBenchmark Results (ms):');
  console.log('======================');
  console.log(`Key Generation: ${keyGenTime.toFixed(2)} ms/operation`);
  console.log(`Encapsulation: ${encapTime.toFixed(2)} ms/operation`);
  console.log(`Decapsulation: ${decapTime.toFixed(2)} ms/operation`);
  console.log(`Cross-Party Encap/Decap: ${crossTime.toFixed(2)} ms/operation`);
  console.log(`Multiple Cycle Encap/Decap: ${cycleTime.toFixed(2)} ms/operation`);
  
  console.log('\nDetailed Analysis:');
  console.log('==================');
  console.log(`- Key generation is ${((encapTime / keyGenTime) * 100).toFixed(1)}% slower than encapsulation`);
  console.log(`- Decapsulation is ${((keyGenTime / decapTime) * 100).toFixed(1)}% faster than key generation`);
  console.log(`- Cross-party operations are ${((crossTime / (encapTime + decapTime)).toFixed(1))}x slower than single-party operations`);
  console.log(`- Multiple cycle operations are ${((cycleTime / (encapTime + decapTime)).toFixed(1))}x slower than single operations`);
}

runBenchmark();
