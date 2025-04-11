import { SecurityLevel } from './types';

export interface VISEContext {
  id: string;
  userId: string;
  securityLevel: SecurityLevel;
  createdAt: number;
  expiresAt: number;
  allowedFunctions: string[];
  sessionData: Record<string, unknown>;
  validationHash: string;
}

export interface VISEService {
  createContext(userId: string, level: SecurityLevel): Promise<VISEContext>;
  validateContext(contextId: string, functionName: string): Promise<boolean>;
  storeContextData(contextId: string, key: string, value: unknown): Promise<boolean>;
  getContextData(contextId: string, key: string): Promise<unknown>;
  terminateContext(contextId: string): Promise<boolean>;
  generateValidationHash(context: VISEContext): string;
}

export { SecurityLevel } from './types';
