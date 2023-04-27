import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from './core/decorators';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return 'OK';
  }
}
