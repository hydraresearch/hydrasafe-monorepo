import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { SecurityGuard, SecurityLevel } from '../guards/security.guard';
import { SECURITY_LEVEL_KEY } from '../decorators/security-level.decorator';

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly securityGuard: SecurityGuard,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requiredLevel = this.reflector.getAllAndOverride<SecurityLevel>(
      SECURITY_LEVEL_KEY,
      [context.getHandler(), context.getClass()],
    ) || SecurityLevel.LOW;

    // Set the required security level
    this.securityGuard.setRequiredLevel(requiredLevel);
    
    // The guard's canActivate method will be called by NestJS
    // before this interceptor's next.handle() is called
    return next.handle();
  }
}
