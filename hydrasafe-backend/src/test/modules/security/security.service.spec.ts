import { Test, TestingModule } from '@nestjs/testing';
import { SecurityService } from '../../../../src/modules/security/security.service';
import { LMVSService } from '../../../../src/modules/security/services/lmvs.service';
import { QZKPService } from '../../../../src/modules/security/services/qzkp.service';
import { VISEService } from '../../../../src/modules/security/services/vise.service';
import { SoulboundService } from '../../../../src/modules/security/services/soulbound.service';

describe('SecurityService', () => {
  let service: SecurityService;

  const mockLmvsService = {
    createVector: jest.fn(),
    createLayer: jest.fn(),
    splitSecret: jest.fn(),
    reconstructSecret: jest.fn(),
    validateVector: jest.fn().mockResolvedValue(true),
    getVector: jest.fn().mockResolvedValue({ isValid: true }),
  };

  const mockQzkpService = {
    generateProof: jest.fn(),
    verifyProof: jest.fn().mockResolvedValue(true),
  };

  const mockViseService = {
    createContext: jest.fn().mockResolvedValue({
      contextId: 'mock-context',
      userId: 'user123',
      level: 'HIGH',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    }),
    getContext: jest.fn().mockResolvedValue({
      contextId: 'mock-context',
      userId: 'user123',
      level: 'HIGH',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    }),
  };

  const mockSoulboundService = {
    bindIdentity: jest.fn().mockResolvedValue(true),
    verifyIdentity: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        { provide: LMVSService, useValue: mockLmvsService },
        { provide: QZKPService, useValue: mockQzkpService },
        { provide: VISEService, useValue: mockViseService },
        { provide: SoulboundService, useValue: mockSoulboundService },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
  });

  describe('validateTransaction', () => {
    it('should return invalid for unbound identity', async () => {
      mockSoulboundService.verifyIdentity.mockResolvedValue(false);

      const result = await service.validateTransaction({ walletAddress: '0x123' }, 'user123');

      expect(result.valid).toBe(false);
      expect(result.riskLevel).toBe('CRITICAL');
      expect(mockSoulboundService.verifyIdentity).toBeCalledWith('user123', '0x123');
    });

    it('should validate transaction with proper security context', async () => {
      mockSoulboundService.verifyIdentity.mockResolvedValue(true);
      mockViseService.createContext.mockResolvedValue({ sessionId: 'session123' });
      mockQzkpService.generateProof.mockResolvedValue('proof123');
      mockQzkpService.verifyProof.mockResolvedValue(true);
      mockLmvsService.splitSecret.mockResolvedValue(['share1', 'share2']);

      const result = await service.validateTransaction({ walletAddress: '0x123' }, 'user123');

      expect(result).toEqual({
        valid: true,
        riskLevel: 'LOW',
        details: {
          lmvsValidation: true,
          qzkpVerification: true,
          soulboundVerification: true,
        },
      });
      expect(mockViseService.createContext).toBeCalledWith('user123', 'HIGH');
      expect(mockLmvsService.validateVector).toBeCalled();
      expect(mockQzkpService.verifyProof).toBeCalled();
      expect(mockSoulboundService.verifyIdentity).toBeCalled();
    });

    it('should handle QZKP verification failure', async () => {
      mockSoulboundService.verifyIdentity.mockResolvedValue(true);
      mockQzkpService.verifyProof.mockResolvedValue(false);

      const result = await service.validateTransaction({ walletAddress: '0x123' }, 'user123');

      expect(result.valid).toBe(false);
      expect(result.riskLevel).toBe('HIGH');
    });
  });

  describe('getSecurityContext', () => {
    it('should get context from vise service', async () => {
      mockViseService.getContext.mockResolvedValue({
        contextId: 'context123',
        userId: 'user123',
        sessionData: { sessionId: 'session123' },
      });

      const result = await service.getSecurityContext('user123');

      expect(result).toEqual({ sessionId: 'session123' });
      expect(mockViseService.getContext).toBeCalledWith('user123');
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      mockSoulboundService.verifyIdentity.mockRejectedValue(new Error('Service down'));

      const result = await service.validateTransaction({ walletAddress: '0x123' }, 'user123');

      expect(result).toEqual({
        valid: false,
        riskLevel: 'CRITICAL',
        details: {
          reason: 'Service down',
        },
      });
    });
  });
});
