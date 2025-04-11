import { SetMetadata } from '@nestjs/common';
import { SecurityLevel } from '../guards/security.guard';

export const SECURITY_LEVEL_KEY = 'securityLevel';
export const RequireSecurityLevel = (level: SecurityLevel) => SetMetadata(SECURITY_LEVEL_KEY, level);
