import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

class BindWalletDto {
  address: string;
  identityFactors: string[];
}

@ApiTags('wallets')
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiResponse({ status: 200, description: 'Wallet created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createWallet() {
    return this.walletService.createWallet();
  }

  @Get(':address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wallet information' })
  @ApiResponse({ status: 200, description: 'Wallet information retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWalletInfo(@Param('address') address: string, @User('id') userId: string) {
    return this.walletService.getWalletInfo(address, userId);
  }

  @Post('bind')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bind wallet to identity' })
  @ApiResponse({ status: 200, description: 'Wallet bound to identity successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async bindWalletToIdentity(@Body() bindRequest: BindWalletDto, @User('id') userId: string) {
    return this.walletService.bindWalletToIdentity(
      bindRequest.address,
      userId,
      bindRequest.identityFactors,
    );
  }
}
