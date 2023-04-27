import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
  Get,
  Put,
  Param,
  ParseUUIDPipe,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import {
  handleCreateError,
  handleResetPasswordError,
  handleUpdatePasswordError,
} from '../core/error-handlers';
import { AuthService } from './auth.service';
import { getResponseUser } from '../helpers';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { COOKIES, MAX_AGE_TOKEN_COOKIE } from '../constants';
import { Public } from '../core/decorators';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.authService.signUp(createUserDto);
      return getResponseUser(user);
    } catch (error) {
      handleCreateError(error);
    }
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Request() req, @Res({ passthrough: true }) response) {
    try {
      const tokens = await this.authService.signIn(req.user);
      response.cookie(COOKIES.REFRESH_TOKEN, tokens.refreshToken, {
        maxAge: MAX_AGE_TOKEN_COOKIE,
        httpOnly: true,
      });

      return tokens;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @Get('refresh')
  async getRefreshTokens(@Request() req, @Res({ passthrough: true }) response) {
    try {
      const tokens = await this.authService.signIn(req.user);
      response.cookie(COOKIES.REFRESH_TOKEN, tokens.refreshToken, {
        maxAge: MAX_AGE_TOKEN_COOKIE,
        httpOnly: true,
      });

      return tokens;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  @Public()
  @Put('reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() { email }: ResetPasswordDto) {
    try {
      await this.authService.resetPassword(email);
    } catch (error) {
      handleResetPasswordError(error, email);
    }
  }

  @Public()
  @Put('update/:code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePassword(
    @Param('code', new ParseUUIDPipe({ version: '4' })) code: string,
    @Body() { password }: UpdatePasswordDto,
  ): Promise<void> {
    try {
      await this.authService.updatePassword(code, password);
    } catch (error) {
      handleUpdatePasswordError(error);
    }
  }

  @Put('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Request() req,
    @Res({ passthrough: true }) response,
  ): Promise<void> {
    try {
      await this.authService.logout(req.user);
      response.clearCookie(COOKIES.REFRESH_TOKEN);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
