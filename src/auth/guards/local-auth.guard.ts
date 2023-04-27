import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Strategies } from 'src/types';

@Injectable()
export class LocalAuthGuard extends AuthGuard(Strategies.LOCAL) {}
