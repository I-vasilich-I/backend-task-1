import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Strategies } from '../../types';
import { ENV_VARIABLES } from '../../constants';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  Strategies.JWT_ACCESS,
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>(ENV_VARIABLES.JWT_SECRET_KEY),
    });
  }

  async validate(payload: any) {
    return payload;
  }
}
