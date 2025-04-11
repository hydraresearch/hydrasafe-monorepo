import { Test, TestingModule } from '@nestjs/testing';
import { QZKPService } from '@backend/modules/security/services/qzkp.service';
import { ethers } from 'ethers';

describe('QZKPService', () => {
  let service: QZKPService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QZKPService],
    }).compile();

    service = module.get<QZKPService>(QZKPService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('proof generation', () => {
    it('should generate quantum-resistant proof', async () => {
      const data = { value: 'test-data' };
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes('test-identity'));

      const proof = await service.generateProof(data, identityHash);
      
      expect(proof).toBeDefined();
      expect(proof.proof).toBeDefined();
      expect(proof.publicSignals).toBeDefined();
      expect(proof.metadata).toBeDefined();
      
      // Verify metadata structure
      expect(proof.metadata).toHaveProperty('version');
      expect(proof.metadata).toHaveProperty('timestamp');
      expect(proof.metadata).toHaveProperty('challengeHash');
    });

    it('should generate different proofs for different data', async () => {
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes('test-identity'));
      
      const proof1 = await service.generateProof({ value: 'data1' }, identityHash);
      const proof2 = await service.generateProof({ value: 'data2' }, identityHash);
      
      expect(proof1.proof).not.toBe(proof2.proof);
    });
  });

  describe('proof verification', () => {
    it('should verify valid proof', async () => {
      const data = { value: 'test-data' };
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes('test-identity'));
      
      const proof = await service.generateProof(data, identityHash);
      const isValid = await service.verifyProof(data, identityHash, proof.proof);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid proof', async () => {
      const data = { value: 'test-data' };
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes('test-identity'));
      
      const fakeProof = 'fake-proof-data';
      const isValid = await service.verifyProof(data, identityHash, fakeProof);
      
      expect(isValid).toBe(false);
    });

    it('should reject proof with mismatched data', async () => {
      const data1 = { value: 'test-data' };
      const data2 = { value: 'different-data' };
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes('test-identity'));
      
      const proof = await service.generateProof(data1, identityHash);
      const isValid = await service.verifyProof(data2, identityHash, proof.proof);
      
      expect(isValid).toBe(false);
    });
  });

  describe('challenge-response protocol', () => {
    it('should handle challenge-response correctly', async () => {
      const data = { value: 'test-data' };
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes('test-identity'));
      
      const challenge = await service.createChallenge(data);
      const response = await service.generateResponse(data, identityHash, challenge);
      
      const isValid = await service.verifyChallengeResponse(
        data,
        identityHash,
        challenge,
        response
      );
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid response', async () => {
      const data = { value: 'test-data' };
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes('test-identity'));
      
      const challenge = await service.createChallenge(data);
      const fakeResponse = 'fake-response-data';
      
      const isValid = await service.verifyChallengeResponse(
        data,
        identityHash,
        challenge,
        fakeResponse
      );
      
      expect(isValid).toBe(false);
    });

    it('should reject expired challenge', async () => {
      const data = { value: 'test-data' };
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes('test-identity'));
      
      // Create challenge with expired timestamp
      const expiredChallenge = {
        challenge: 'test-challenge',
        timestamp: Date.now() - 30000, // 30 seconds ago
        nonce: 'test-nonce'
      };
      
      const response = await service.generateResponse(
        data,
        identityHash,
        expiredChallenge
      );
      
      const isValid = await service.verifyChallengeResponse(
        data,
        identityHash,
        expiredChallenge,
        response
      );
      
      expect(isValid).toBe(false);
    });
  });
});
