import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '@hydrasafe/common/src/models/user/user';
import { Logger } from '../../../utils/logger';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    @InjectModel('User') private readonly userModel: Model<IUser>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'hydrasafe-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Verify the user exists and is active
      const user = await this.userModel.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Return user data from payload
      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        walletAddress: payload.walletAddress,
        securityContextId: payload.securityContextId
      };
    } catch (error) {
      this.logger.error('JWT validation failed', error.stack);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
