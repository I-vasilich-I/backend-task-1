import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../mailer/mailer.service';
import { MailerService as MailService } from '@nestjs-modules/mailer';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ResponseUser, TokenPayload } from '../types';
import * as bcrypt from 'bcrypt';
import * as uuid from 'uuid';
import { User } from '@prisma/client';
import { NotFoundError } from '../core/errors';

jest.mock('../users/users.service');
jest.mock('uuid');

class MailServiceFake {
  public sendMail(): void {
    /** */
  }
}

const clientUrl = 'client';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let mailerService: MailerService;
  let jwtService: JwtService;

  const user: ResponseUser = {
    id: 1,
    email: 'email',
    firstName: 'john',
    lastName: 'doe',
    image: null,
    pdf: null,
  };

  const userInDB: User = {
    ...user,
    password: 'password',
    refreshToken: 'token',
    resetCode: null,
  };

  const tokens = {
    accessToken: 'a-token',
    refreshToken: 'r-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        ConfigService,
        JwtService,
        MailService,
        MailerService,
      ],
    })
      .overrideProvider(MailService)
      .useClass(MailServiceFake)
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn(() => clientUrl),
      })
      .compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    mailerService = module.get<MailerService>(MailerService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    const createUserDto = new CreateUserDto();
    createUserDto.password = 'password';
    const getHashedPasswordSpy = jest.spyOn(
      AuthService.prototype as any,
      'getHashedPassword',
    );

    it('should call getHashedPassword with password', async () => {
      await service.signUp(createUserDto);
      expect(getHashedPasswordSpy).toBeCalledWith(createUserDto.password);
    });

    it('should call usersService.create with data and hashed password', async () => {
      const createSpy = jest.spyOn(usersService, 'create');
      getHashedPasswordSpy.mockResolvedValueOnce('hash');
      await service.signUp(createUserDto);
      expect(createSpy).toBeCalledWith({ ...createUserDto, password: 'hash' });
    });

    it('should return created user', async () => {
      jest.spyOn(usersService, 'create').mockResolvedValueOnce(userInDB);
      getHashedPasswordSpy.mockResolvedValueOnce('hash');
      expect(await service.signUp(createUserDto)).toEqual(userInDB);
    });
  });

  describe('signIn', () => {
    const getTokens = jest.spyOn(AuthService.prototype as any, 'getTokens');
    const payload = {
      id: userInDB.id,
      email: userInDB.email,
    };

    it('should call getTokens with proper payload', async () => {
      getTokens.mockResolvedValueOnce(tokens);
      await service.signIn(userInDB);
      expect(getTokens).toBeCalledWith(payload);
    });

    it('should call usersService.update with refresh token', async () => {
      getTokens.mockResolvedValueOnce(tokens);
      const updateSpy = jest.spyOn(usersService, 'update');
      await service.signIn(userInDB);
      expect(updateSpy).toBeCalledWith(userInDB.id, {
        refreshToken: tokens.refreshToken,
      });
    });

    it('should return pair of tokens', async () => {
      getTokens.mockResolvedValueOnce(tokens);
      expect(await service.signIn(userInDB)).toEqual(tokens);
    });
  });

  describe('validateUser', () => {
    const { email, password } = userInDB;

    it('should call usersService.findOneByProps with email', async () => {
      const findOneByPropsSpy = jest.spyOn(usersService, 'findOneByProps');
      await service.validateUser(email, password);
      expect(findOneByPropsSpy).toBeCalledWith({ email });
    });

    it('should return null when user not found', async () => {
      jest.spyOn(usersService, 'findOneByProps').mockResolvedValueOnce(null);
      expect(await service.validateUser(email, password)).toBe(null);
    });

    it('should call compare with proper props', async () => {
      const password = 'pass';
      const compareSpy = jest.spyOn(bcrypt, 'compare');
      jest
        .spyOn(usersService, 'findOneByProps')
        .mockResolvedValueOnce(userInDB);

      await service.validateUser(email, password);
      expect(compareSpy).toBeCalledWith(password, userInDB.password);
    });

    it('should return user when password is valid', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => true);
      jest
        .spyOn(usersService, 'findOneByProps')
        .mockResolvedValueOnce(userInDB);
      expect(await service.validateUser(email, password)).toEqual(userInDB);
    });

    it('should return null when password is invalid', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => false);
      jest
        .spyOn(usersService, 'findOneByProps')
        .mockResolvedValueOnce(userInDB);
      expect(await service.validateUser(email, password)).toEqual(null);
    });
  });

  describe('validateRefreshToken', () => {
    it('should call usersService.findOne with id', async () => {
      const findOneSpy = jest.spyOn(usersService, 'findOne');
      await service.validateRefreshToken('token', userInDB.id);
      expect(findOneSpy).toBeCalledWith(userInDB.id);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(usersService, 'findOne').mockRejectedValueOnce(null);
      expect(await service.validateRefreshToken('token', userInDB.id)).toBe(
        null,
      );
    });

    it('should return null when refreshToken does not match', async () => {
      const token = 'wrong';
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(userInDB);
      expect(await service.validateRefreshToken(token, userInDB.id)).toBe(null);
    });

    it('should return user when refreshToken does match', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(userInDB);
      expect(
        await service.validateRefreshToken(
          userInDB.refreshToken as string,
          userInDB.id,
        ),
      ).toBe(userInDB);
    });
  });

  describe('resetPassword', () => {
    const { email } = userInDB;

    it('should call usersService.findOneByProps with email', async () => {
      try {
        const findOneByPropsSpy = jest.spyOn(usersService, 'findOneByProps');
        await service.resetPassword(email);
        expect(findOneByPropsSpy).toBeCalledWith({ email });
      } catch (error) {}
    });

    it('should throw NotFoundError when user not found', async () => {
      try {
        await service.resetPassword(email);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });

    it('should generate reset code', async () => {
      jest
        .spyOn(usersService, 'findOneByProps')
        .mockResolvedValueOnce(userInDB);
      const uuidSpy = jest.spyOn(uuid, 'v4');
      await service.resetPassword(email);
      expect(uuidSpy).toBeCalled();
    });

    it('should call usersService.update with reset code', async () => {
      const code = 'code';
      jest
        .spyOn(usersService, 'findOneByProps')
        .mockResolvedValueOnce(userInDB);
      jest.spyOn(uuid, 'v4').mockReturnValueOnce(code);
      const updateSpy = jest.spyOn(usersService, 'update');
      await service.resetPassword(email);
      expect(updateSpy).toBeCalledWith(userInDB.id, { resetCode: code });
    });

    it('should send reset password mail', async () => {
      const code = 'code';
      const link = `${clientUrl}/reset-password/${code}`;
      jest
        .spyOn(usersService, 'findOneByProps')
        .mockResolvedValueOnce(userInDB);
      jest.spyOn(uuid, 'v4').mockReturnValueOnce(code);
      const sendResetPasswordMailSpy = jest.spyOn(
        mailerService,
        'sendResetPasswordMail',
      );
      await service.resetPassword(email);
      expect(sendResetPasswordMailSpy).toBeCalledWith(
        userInDB.firstName,
        email,
        link,
      );
    });
  });

  describe('updatePassword', () => {
    const resetCode = 'code';
    const password = 'password';
    const hash = 'hash';
    const getHashedPasswordSpy = jest.spyOn(
      AuthService.prototype as any,
      'getHashedPassword',
    );

    it('should call usersService.findOneByProps with resetCode', async () => {
      try {
        const findOneByPropsSpy = jest.spyOn(usersService, 'findOneByProps');
        await service.updatePassword(resetCode, password);
        expect(findOneByPropsSpy).toBeCalledWith({ resetCode });
      } catch (error) {}
    });

    it('should throw NotFoundError when user not found', async () => {
      try {
        await service.updatePassword(resetCode, password);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });

    it('should call getHashedPassword with password', async () => {
      jest
        .spyOn(usersService, 'findOneByProps')
        .mockResolvedValueOnce(userInDB);

      await service.updatePassword(resetCode, password);
      expect(getHashedPasswordSpy).toBeCalledWith(password);
    });

    it('should call usersService.update with proper props', async () => {
      jest
        .spyOn(usersService, 'findOneByProps')
        .mockResolvedValueOnce(userInDB);

      getHashedPasswordSpy.mockResolvedValueOnce(hash);
      const updateSpy = jest.spyOn(usersService, 'update');
      await service.updatePassword(resetCode, password);
      expect(updateSpy).toBeCalledWith(userInDB.id, {
        password: hash,
        resetCode: null,
      });
    });
  });

  describe('logout', () => {
    it('should call usersService.update to set refreshToken null', async () => {
      const payload = { id: 1 } as TokenPayload;
      const updateSpy = jest.spyOn(usersService, 'update');
      await service.logout(payload);
      expect(updateSpy).toBeCalledWith(payload.id, { refreshToken: null });
    });
  });

  describe('getHashedPassword', () => {
    it('should return hashed password', async () => {
      jest.spyOn(bcrypt, 'hash').mockImplementationOnce(() => 'hashed');
      expect(await service['getHashedPassword']('password')).toBe('hashed');
    });
  });

  describe('getTokens', () => {
    const tokens = {
      accessToken: 'token',
      refreshToken: 'token',
    };

    const payload = {
      id: 1,
      email: 'email',
    };

    it('should return tokens', async () => {
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token');
      expect(await service['getTokens'](payload)).toEqual(tokens);
    });
  });
});
