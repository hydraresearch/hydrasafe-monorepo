import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { SecurityModule } from './modules/security/security.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        const dbName = configService.get<string>('MONGODB_DB_NAME');

        if (!uri) {
          throw new Error('MongoDB URI is not defined in environment variables');
        }

        return {
          uri,
          dbName,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
    }),

    // Rate limiting
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minute
          limit: 100,
        },
      ],
    }),

    // Feature modules
    AuthModule,
    WalletModule,
    TransactionModule,
    SecurityModule,
  ],
})
export class AppModule {}
