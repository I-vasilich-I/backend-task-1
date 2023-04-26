import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Strategies } from '../../types';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard(Strategies.JWT_REFRESH) {}
