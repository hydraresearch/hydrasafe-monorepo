import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

class TransactionDto {
  from: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

class SignTransactionDto extends TransactionDto {
  privateKey: string;
}

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction validation result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async validateTransaction(@Body() transaction: TransactionDto, @User('id') userId: string) {
    return this.transactionService.validateTransaction(transaction, userId);
  }

  @Post('sign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign and submit a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signAndSubmitTransaction(
    @Body() signRequest: SignTransactionDto,
    @User('id') userId: string,
  ) {
    // Validate the transaction first
    const validation = await this.transactionService.validateTransaction(signRequest, userId);

    // If validation passes, sign and submit the transaction
    if (validation.valid) {
      const txHash = await this.transactionService.signAndSubmitTransaction(
        signRequest,
        signRequest.privateKey,
      );

      return {
        success: true,
        txHash,
        validation,
      };
    }

    // If validation fails, return the validation result
    return {
      success: false,
      validation,
      message: 'Transaction validation failed',
    };
  }
}
