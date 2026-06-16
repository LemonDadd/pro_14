import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'baby-tracker-jwt-secret-key-2024',
    });
  }

  async validate(payload: any): Promise<CurrentUserPayload> {
    return {
      userId: payload.sub,
      openid: payload.openid,
    };
  }
}
