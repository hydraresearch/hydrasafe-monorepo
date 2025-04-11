import { Test, TestingModule } from '@nestjs/testing';
import { LMVSService } from '../../../modules/security/services/lmvs.service';
import { SecurityLevel } from '@common/src/security/types';

describe('LMVSService', () => {
  let service: LMVSService;
  const mockLmvsService = {
    generateShares: jest.fn().mockResolvedValue({
      recoveryId: 'mock-recovery-id',
      shares: [
        { index: 1, share: 'share1', verificationHash: 'hash1' },
        { index: 2, share: 'share2', verificationHash: 'hash2' },
      ],
    }),
    recoverSecret: jest.fn().mockResolvedValue('recovered-secret'),
    createVector: jest.fn().mockResolvedValue({
      id: 'mock-vector-id',
      coordinates: [1, 2, 3],
      threshold: 3,
    }),
    getVector: jest.fn().mockResolvedValue({
      id: 'mock-vector-id',
      coordinates: [1, 2, 3],
      threshold: 3,
    }),
    createLayer: jest.fn().mockResolvedValue({
      id: 'mock-layer-id',
      vectors: [
        {
          id: 'mock-vector-id',
          coordinates: [1, 2, 3],
          threshold: 3,
        },
      ],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        securityLevel: SecurityLevel.HIGH,
      },
    }),
    getLayer: jest.fn().mockResolvedValue({
      id: 'mock-layer-id',
      vectors: [
        {
          id: 'mock-vector-id',
          coordinates: [1, 2, 3],
          threshold: 3,
        },
      ],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        securityLevel: SecurityLevel.HIGH,
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LMVSService,
        {
          provide: LMVSService,
          useValue: mockLmvsService,
        },
      ],
    }).compile();

    service = module.get<LMVSService>(LMVSService);
  });

  describe('share generation', () => {
    it('should generate shares', async () => {
      const shares = await service.generateShares('secret', 3, 5);

      expect(shares).toBeDefined();
      expect(shares.recoveryId).toBeDefined();
      expect(shares.shares).toHaveLength(5);
      shares.shares.forEach((share) => {
        expect(share).toBeDefined();
        expect(share.index).toBeDefined();
        expect(share.share).toBeDefined();
        expect(share.verificationHash).toBeDefined();
      });
    });

    it('should throw error for invalid threshold', async () => {
      await expect(() => {
        service.generateShares('secret', 0, 5);
      }).rejects.toThrow('Threshold must be greater than 0');
    });

    it('should throw error for invalid total shares', async () => {
      await expect(() => {
        service.generateShares('secret', 3, 2);
      }).rejects.toThrow('Total shares must be greater than or equal to threshold');
    });
  });

  describe('secret recovery', () => {
    it('should recover secret', async () => {
      const shares = [
        { index: 1, share: 'share1', verificationHash: 'hash1' },
        { index: 2, share: 'share2', verificationHash: 'hash2' },
      ];
      const secret = await service.recoverSecret('mock-recovery-id', shares);

      expect(secret).toBeDefined();
      expect(secret).toBe('recovered-secret');
    });

    it('should throw error for insufficient shares', async () => {
      await expect(() => {
        service.recoverSecret('mock-recovery-id', []);
      }).rejects.toThrow('Insufficient shares provided');
    });

    it('should throw error for invalid recovery ID', async () => {
      await expect(() => {
        service.recoverSecret('invalid-id', [
          { index: 1, share: 'share1', verificationHash: 'hash1' },
        ]);
      }).rejects.toThrow('Invalid recovery ID');
    });
  });

  describe('vector operations', () => {
    it('should create and retrieve vector', async () => {
      const vector = await service.createVector([1, 2, 3], 3);

      expect(vector).toBeDefined();
      expect(vector.id).toBeDefined();
      expect(vector.coordinates).toEqual([1, 2, 3]);
      expect(vector.threshold).toBe(3);
    });

    it('should create and retrieve layer', async () => {
      const vector = await service.createVector([1, 2, 3], 3);
      const layer = await service.createLayer([vector.id], SecurityLevel.HIGH);

      expect(layer).toBeDefined();
      expect(layer.id).toBeDefined();
      expect(layer.vectors).toHaveLength(1);
      expect(layer.metadata.securityLevel).toBe(SecurityLevel.HIGH);
    });

    it('should get existing layer', async () => {
      const vector = await service.createVector([1, 2, 3], 3);
      const layer = await service.createLayer([vector.id], SecurityLevel.HIGH);
      const retrieved = await service.getLayer(layer.id);

      expect(retrieved).toEqual(layer);
    });

    it('should throw error for non-existent layer', async () => {
      await expect(() => {
        service.getLayer('non-existent-id');
      }).rejects.toThrow('Layer not found');
    });

    it('should validate security level', async () => {
      const vector = await service.createVector([1, 2, 3], 3);

      await expect(() => {
        service.createLayer([vector.id], 'INVALID' as any);
      }).rejects.toThrow('Invalid security level');
    });
  });
});
