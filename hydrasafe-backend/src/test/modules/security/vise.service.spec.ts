import { Test, TestingModule } from '@nestjs/testing';
import { VISEService } from '../../../modules/security/services/vise.service';
import { SecurityLevel } from '@common/security/vise';

const mockSessionId = '0x' + 'a'.repeat(32);

describe('VISEService', () => {
  let service: VISEService;
  const mockViseService = {
    createContext: jest.fn().mockResolvedValue({
      sessionId: mockSessionId,
      userId: 'test-user',
      tenantId: 'test-tenant',
      securityLevel: SecurityLevel.HIGH,
      timestamp: Date.now(),
      sessionTimeout: 3600000,
      allowedFunctions: ['read', 'view', 'list', 'get', 'update', 'verify', 'create', 'sign'],
      metadata: {},
    }),
    validateContext: jest.fn().mockResolvedValue(true),
    storeContextData: jest.fn().mockResolvedValue(true),
    getContextData: jest.fn().mockResolvedValue({}),
    terminateContext: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VISEService,
        {
          provide: VISEService,
          useValue: mockViseService
        }
      ]
    }).compile();

    service = module.get<VISEService>(VISEService);
  });

  describe('security context operations', () => {
    it('should create security context', async () => {
      const userId = 'test-user';
      const tenantId = 'test-tenant';
      const level = SecurityLevel.HIGH;

      const context = await service.createContext(userId, level, tenantId);
      
      expect(context).toBeDefined();
      expect(context.sessionId).toBeDefined();
      expect(context.userId).toBe(userId);
      expect(context.tenantId).toBe(tenantId);
      expect(context.securityLevel).toBe(level);
      expect(context.allowedFunctions).toEqual(['read', 'view', 'list', 'get', 'update', 'verify', 'create', 'sign']);
    });

    it('should validate context', async () => {
      const sessionId = mockSessionId;
      const functionName = 'read';
      const isValid = await service.validateContext(sessionId, functionName);
      
      expect(isValid).toBe(true);
    });

    it('should store and retrieve context data', async () => {
      const sessionId = mockSessionId;
      const key = 'test-data';
      const value = { data: 'test' };

      const stored = await service.storeContextData(sessionId, key, value);
      expect(stored).toBe(true);

      const retrieved = await service.getContextData(sessionId, key);
      expect(retrieved).toEqual(value);
    });

    it('should terminate context', async () => {
      const sessionId = mockSessionId;
      const success = await service.terminateContext(sessionId);
      
      expect(success).toBe(true);
    });

    it('should validate context expiration', async () => {
      const sessionId = mockSessionId;
      const functionName = 'read';

      // Mock time passing
      jest.spyOn(Date, 'now').mockImplementation(() => {
        const context = mockViseService.getContextData(sessionId, 'timestamp');
        return context + mockViseService.getContextData(sessionId, 'sessionTimeout') + 1;
      });

      const isValid = await service.validateContext(sessionId, functionName);
      expect(isValid).toBe(false);
    });

    it('should validate function permissions', async () => {
      const sessionId = mockSessionId;
      const allowedFunction = 'read';
      const disallowedFunction = 'adminFunction';

      // First test allowed function
      const isValidAllowed = await service.validateContext(sessionId, allowedFunction);
      expect(isValidAllowed).toBe(true);

      // Then test disallowed function
      const isValidDisallowed = await service.validateContext(sessionId, disallowedFunction);
      expect(isValidDisallowed).toBe(false);
    });
  });
});
