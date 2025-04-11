import { SecurityLevel } from '../types';
import { VISE, requireVISEContext } from '../vise';

// Mock class for testing
@requireVISEContext(SecurityLevel.LOW)
class TestClass {
  @requireVISEContext(SecurityLevel.MEDIUM)
  protectedMethod(context: VISE.SecurityContext): string {
    return 'protected';
  }

  @requireVISEContext(SecurityLevel.HIGH)
  privateMethod(context: VISE.SecurityContext): string {
    return 'private';
  }

  @requireVISEContext(SecurityLevel.CRITICAL)
  publicMethod(context: VISE.SecurityContext): string {
    return 'public';
  }
}

describe('VISE', () => {
  let testClass: TestClass;
  let context: VISE.SecurityContext;

  beforeEach(() => {
    testClass = new TestClass();
    context = VISE.createContext(
      'user123',
      'tenant456',
      SecurityLevel.LOW,
      300000, // 5 minutes
      ['protectedMethod'],
      'TestClass'
    );
  });

  describe('Context Management', () => {
    it('should create a valid context', () => {
      expect(context.sessionId).toBeDefined();
      expect(context.securityLevel).toBe(SecurityLevel.LOW);
      expect(context.userId).toBe('user123');
      expect(context.tenantId).toBe('tenant456');
    });

    it('should validate context', () => {
      expect(VISE.validateVISEContext(context)).toBe(true);

      // Test expired context
      const expiredContext = { ...context, timestamp: Date.now() - 300000 - 1 };
      expect(VISE.validateVISEContext(expiredContext)).toBe(false);

      // Test invalid security level
      const invalidContext = { ...context, securityLevel: 'INVALID' as any };
      expect(VISE.validateVISEContext(invalidContext)).toBe(false);
    });

    it('should update context', () => {
      const updates = {
        securityLevel: SecurityLevel.HIGH,
        allowedFunctions: ['protectedMethod', 'publicMethod'],
        metadata: { custom: 'data' }
      };

      expect(VISE.updateContext(context.sessionId, updates)).toBe(true);
      const updatedContext = VISE.getContext(context.sessionId);
      expect(updatedContext?.securityLevel).toBe(SecurityLevel.HIGH);
    });
  });

  describe('Security Decorators', () => {
    it('should enforce security levels', () => {
      // LOW level context should work with LOW level method
      expect(testClass['protectedMethod'](context)).toBe('protected');

      // LOW level context should fail with MEDIUM level method
      expect(() => testClass['privateMethod'](context)).toThrow('This operation requires MEDIUM security level');

      // LOW level context should fail with CRITICAL level method
      expect(() => testClass['publicMethod'](context)).toThrow('This operation requires CRITICAL security level');
    });

    it('should enforce function allowlist', () => {
      // Update context to allow privateMethod
      VISE.updateContext(context.sessionId, {
        allowedFunctions: ['privateMethod']
      });

      // Should work since privateMethod is now allowed
      expect(testClass['privateMethod'](context)).toBe('private');

      // Should fail since protectedMethod is not in allowlist
      expect(() => testClass['protectedMethod'](context)).toThrow('Function protectedMethod is not allowed in this context');
    });

    it('should enforce caller authorization', () => {
      // Update context to allow publicMethod but with different caller
      VISE.updateContext(context.sessionId, {
        allowedFunctions: ['publicMethod'],
        callerId: 'DifferentClass'
      });

      // Should fail since callerId doesn't match
      expect(() => testClass['publicMethod'](context)).toThrow('Unauthorized caller: TestClass');
    });
  });

  describe('Session Management', () => {
    it('should manage sessions', () => {
      // Create a new session
      const sessionId = context.sessionId;
      expect(VISE.getContext(sessionId)).toBeDefined();

      // Revoke the session
      VISE.revokeContext(sessionId);
      expect(VISE.getContext(sessionId)).toBeUndefined();

      // Create a new session with timeout
      const newContext = VISE.createContext(
        'user123',
        'tenant456',
        SecurityLevel.LOW,
        1000 // 1 second timeout
      );

      // Wait for timeout
      setTimeout(() => {
        expect(VISE.getContext(newContext.sessionId)).toBeUndefined();
      }, 1500);
    });
  });
});
