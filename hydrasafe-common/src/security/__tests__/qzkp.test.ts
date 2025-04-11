import { QuantumStateVector, QuantumZKP } from '../qzkp';
import { SecurityLevel } from '../types';
import { VISE } from '../vise';
import { requireVISEContext } from '../vise';

// Mock key pair for testing
const MOCK_PRIVATE_KEY = 'mock_private_key';
const MOCK_PUBLIC_KEY = 'mock_public_key';

// Mock class for testing QZKP
@requireVISEContext(SecurityLevel.HIGH)
class TestQZKPClass {
  @requireVISEContext(SecurityLevel.CRITICAL)
  testMethod(context: VISE.SecurityContext): void {
    // Test method that uses QZKP
    const vector = new QuantumStateVector([1, 0], 0, 'TEST');
    const qzkp = new QuantumZKP(MOCK_PRIVATE_KEY, MOCK_PUBLIC_KEY);
    const proof = qzkp.generateProof(vector, 'test-identifier');
    const isValid = qzkp.verifyProof(proof.commitment, proof, 'test-identifier');
    
    if (!isValid) {
      throw new Error('QZKP verification failed');
    }
  }
}

describe('QZKP', () => {
  let testClass: TestQZKPClass;
  let context: VISE.SecurityContext;
  let qzkp: QuantumZKP;

  beforeEach(() => {
    testClass = new TestQZKPClass();
    context = VISE.createContext(
      'user123',
      'tenant456',
      SecurityLevel.HIGH,
      300000,
      ['testMethod'],
      'TestQZKPClass'
    );
    qzkp = new QuantumZKP(MOCK_PRIVATE_KEY, MOCK_PUBLIC_KEY);
  });

  describe('QuantumStateVector', () => {
    it('should create and serialize vector', () => {
      const vector = new QuantumStateVector([1, 0], 0, 'TEST');
      const serialized = vector.serialize();
      expect(serialized).toBeDefined();
      
      // Deserialize and verify
      const newVector = new QuantumStateVector([], 0, '');
      newVector.deserialize(serialized);
      expect(newVector.coordinates).toEqual([1, 0]);
      expect(newVector.stateType).toBe('TEST');
    });

    it('should calculate coherence', () => {
      const vector = new QuantumStateVector([1, 0], 0, 'TEST');
      expect(vector.coherence).toBe(0.5);
    });
  });

  describe('Proof Generation and Verification', () => {
    it('should generate and verify proof', () => {
      const vector = new QuantumStateVector([1, 0], 0, 'TEST');
      const proof = qzkp.generateProof(vector, 'test-identifier');
      
      expect(proof.commitment).toBeDefined();
      expect(proof.measurements).toBeDefined();
      expect(proof.basisCoefficients).toBeDefined();
      expect(proof.signature).toBeDefined();

      const isValid = qzkp.verifyProof(proof.commitment, proof, 'test-identifier');
      expect(isValid).toBe(true);
    });

    it('should fail verification with invalid signature', () => {
      const vector = new QuantumStateVector([1, 0], 0, 'TEST');
      const proof = qzkp.generateProof(vector, 'test-identifier');
      
      // Modify the signature to make it invalid
      proof.signature = 'invalid_signature';

      const isValid = qzkp.verifyProof(proof.commitment, proof, 'test-identifier');
      expect(isValid).toBe(false);
    });

    it('should fail verification with different identifier', () => {
      const vector = new QuantumStateVector([1, 0], 0, 'TEST');
      const proof = qzkp.generateProof(vector, 'test-identifier');
      
      const isValid = qzkp.verifyProof(proof.commitment, proof, 'different-identifier');
      expect(isValid).toBe(false);
    });
  });

  describe('Security Decorators', () => {
    it('should enforce security levels', () => {
      // Create context with lower security level
      const lowContext = VISE.createContext(
        'user123',
        'tenant456',
        SecurityLevel.LOW,
        300000,
        ['testMethod'],
        'TestQZKPClass'
      );

      // Should fail with LOW security level
      expect(() => testClass.testMethod(lowContext)).toThrow('This operation requires CRITICAL security level');

      // Should succeed with HIGH security level
      expect(() => testClass.testMethod(context)).not.toThrow();
    });

    it('should enforce function allowlist', () => {
      // Create context without testMethod in allowlist
      const restrictedContext = VISE.createContext(
        'user123',
        'tenant456',
        SecurityLevel.HIGH,
        300000,
        [],
        'TestQZKPClass'
      );

      // Should fail since testMethod is not allowed
      expect(() => testClass.testMethod(restrictedContext)).toThrow('Function testMethod is not allowed in this context');
    });
  });

  describe('Cache Management', () => {
    it('should cache verification results', () => {
      const vector = new QuantumStateVector([1, 0], 0, 'TEST');
      const proof = qzkp.generateProof(vector, 'test-identifier');
      const commitment = proof.commitment;
      
      // First verification should not be cached
      const firstResult = qzkp.verifyProof(commitment, proof, 'test-identifier');
      expect(firstResult).toBe(true);

      // Second verification should use cache
      const secondResult = qzkp.verifyProof(commitment, proof, 'test-identifier');
      expect(secondResult).toBe(true);
    });
  });
});
