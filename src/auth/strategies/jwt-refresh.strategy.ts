import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ForbiddenException, Injectable, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenPayload, Strategies } from '../../types';
import { ENV_VARIABLES, EXCEPTION_MESSAGES } from '../../constants';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  Strategies.JWT_REFRESH,
) {
  constructor(private authService: AuthService, config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.refreshToken ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>(ENV_VARIABLES.JWT_SECRET_REFRESH_KEY),
      passReqToCallback: true,
    });
  }

  async validate(@Request() req, payload: TokenPayload) {
    const user = await this.authService.validateRefreshToken(
      req.cookies.refreshToken,
      payload.id,
    );

    if (!user) {
      throw new ForbiddenException(EXCEPTION_MESSAGES.REFRESH_TOKEN_MALFORMED);
    }

    return user;
  }
}
