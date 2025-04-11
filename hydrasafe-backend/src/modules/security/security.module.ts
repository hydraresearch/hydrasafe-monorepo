import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { QZKPService } from './services/qzkp.service';
import { LMVSService } from './services/lmvs.service';
import { VISEService } from './services/vise.service';
import { SoulboundService } from './services/soulbound.service';
import { SecurityGuard } from './guards/security.guard';
import { SecurityInterceptor } from './interceptors/security.interceptor';

@Module({
  providers: [
    SecurityService, 
    QZKPService, 
    LMVSService, 
    VISEService, 
    SoulboundService,
    SecurityGuard,
    SecurityInterceptor
  ],
  controllers: [SecurityController],
  exports: [
    SecurityService, 
    QZKPService, 
    LMVSService, 
    VISEService, 
    SoulboundService,
    SecurityGuard,
    SecurityInterceptor
  ],
})
export class SecurityModule {}
