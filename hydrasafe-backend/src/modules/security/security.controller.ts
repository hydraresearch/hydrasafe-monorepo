import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@ApiTags('security')
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('validate-transaction')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a transaction using all security components' })
  @ApiResponse({ status: 200, description: 'Transaction validation result' })
  async validateTransaction(@Body() transaction: any, @User('id') userId: string) {
    return this.securityService.validateTransaction(transaction, userId);
  }

  @Post('setup-recovery')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set up a recovery mechanism using LMVS' })
  @ApiResponse({ status: 200, description: 'Recovery setup result' })
  async setupRecovery(@Body() recoveryData: any, @User('id') userId: string) {
    return this.securityService.setupRecovery(userId, recoveryData);
  }

  @Post('recover')
  @ApiOperation({ summary: 'Recover using shares' })
  @ApiResponse({ status: 200, description: 'Recovery result' })
  async recoverWithShares(@Body() recoveryData: { recoveryId: string; shares: any[] }) {
    return this.securityService.recoverWithShares(recoveryData.recoveryId, recoveryData.shares);
  }

  @Post('authenticate')
  @ApiOperation({ summary: 'Authenticate with enhanced security' })
  @ApiResponse({ status: 200, description: 'Authentication result' })
  async authenticate(@Body() credentials: any) {
    return this.securityService.authenticateWithSecurity(credentials.userId, credentials);
  }
}
