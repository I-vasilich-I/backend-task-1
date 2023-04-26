import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { MailerService } from '../mailer/mailer.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ENV_VARIABLES } from '../constants';
import { TokenPayload } from '../types';
import { NotFoundError } from '../core/errors';

const {
  JWT_SECRET_KEY,
  JWT_SECRET_REFRESH_KEY,
  TOKEN_EXPIRE_TIME,
  TOKEN_REFRESH_EXPIRE_TIME,
  HASH_ROUNDS,
  CLIENT_URL,
} = ENV_VARIABLES;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private mailerService: MailerService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async signUp({ password, ...rest }: CreateUserDto) {
    const hashedPassword = await this.getHashedPassword(password);
    const data = {
      ...rest,
      password: hashedPassword,
    };

    const user = await this.usersService.create(data);
    return user;
  }

  async signIn({ id, email }: User) {
    const payload = { id, email };
    const tokens = await this.getTokens(payload);
    await this.usersService.update(id, { refreshToken: tokens.refreshToken });

    return tokens;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findOneByProps({ email });

    if (!user) {
      return null;
    }

    const isValidPassword = await compare(password, user.password);

    return isValidPassword ? user : null;
  }

  async validateRefreshToken(refreshToken: string, id: number) {
    try {
      const user = await this.usersService.findOne(id);
      const isValid = user.refreshToken === refreshToken;
      return isValid ? user : null;
    } catch (error) {
      return null;
    }
  }

  async resetPassword(email: string) {
    const user = await this.usersService.findOneByProps({ email });

    if (!user) {
      throw new NotFoundError();
    }

    const code = uuid();

    await this.usersService.update(user.id, { resetCode: code });

    const clientUrl = this.configService.get(CLIENT_URL);
    const resetPasswordLink = `${clientUrl}/reset-password/${code}`;

    await this.mailerService.sendResetPasswordMail(
      user.firstName,
      email,
      resetPasswordLink,
    );
  }

  async updatePassword(code: string, password: string) {
    const user = await this.usersService.findOneByProps({ resetCode: code });

    if (!user) {
      throw new NotFoundError();
    }

    const hashedPassword = await this.getHashedPassword(password);
    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetCode: null,
    });
  }

  async logout({ id }: TokenPayload) {
    await this.usersService.update(id, { refreshToken: null });
  }

  private async getHashedPassword(password: string) {
    const hashRounds = Number(this.configService.get(HASH_ROUNDS) ?? 10);
    const hashedPassword = await hash(password, hashRounds);

    return hashedPassword;
  }

  private async getTokens(payload: TokenPayload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>(JWT_SECRET_KEY),
      expiresIn: this.configService.get<string>(TOKEN_EXPIRE_TIME),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>(JWT_SECRET_REFRESH_KEY),
      expiresIn: this.configService.get<string>(TOKEN_REFRESH_EXPIRE_TIME),
    });

    return { accessToken, refreshToken };
  }
}
