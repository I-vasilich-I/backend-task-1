import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PrismaErrorCodes, ResponseUser } from '../types';
import { Prisma, User } from '@prisma/client';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

jest.mock('./auth.service.ts');

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

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

  const notUniqueError = new Prisma.PrismaClientKnownRequestError('error', {
    code: PrismaErrorCodes.NOT_UNIQUE,
    clientVersion: '1',
    meta: { target: 'email' },
  });
  const notFoundError = new Prisma.PrismaClientKnownRequestError('error', {
    code: PrismaErrorCodes.NOT_FOUND,
    clientVersion: '1',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    const createUserDto = new CreateUserDto();
    it('should return created user', async () => {
      jest.spyOn(service, 'signUp').mockResolvedValueOnce(userInDB);
      expect(await controller.signUp(createUserDto)).toEqual(user);
    });

    it('should throw BadRequestException when email is not unique', async () => {
      jest.spyOn(service, 'signUp').mockRejectedValueOnce(notUniqueError);
      try {
        await controller.signUp(createUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('should throw BadRequestException on wrong data', async () => {
      jest.spyOn(service, 'signUp').mockRejectedValueOnce(null);
      try {
        await controller.signUp(createUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('signIn', () => {
    const responseMock = {
      cookie: jest.fn(),
    };

    const requestMock = {
      user: 'user',
    };

    it('should call signIn service and return pair of tokens', async () => {
      jest.spyOn(service, 'signIn').mockResolvedValueOnce(tokens);
      expect(await controller.signIn(requestMock, responseMock)).toEqual(
        tokens,
      );
    });

    it('should throw InternalServerErrorException on signIn error', async () => {
      try {
        jest.spyOn(service, 'signIn').mockRejectedValueOnce(null);
        await controller.signIn(requestMock, responseMock);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('getRefreshTokens', () => {
    const responseMock = {
      cookie: jest.fn(),
    };

    const requestMock = {
      user: 'user',
    };

    it('should call signIn service and return pair of tokens', async () => {
      jest.spyOn(service, 'signIn').mockResolvedValueOnce(tokens);
      expect(
        await controller.getRefreshTokens(requestMock, responseMock),
      ).toEqual(tokens);
    });

    it('should throw InternalServerErrorException on signIn error', async () => {
      try {
        jest.spyOn(service, 'signIn').mockRejectedValueOnce(null);
        await controller.signIn(requestMock, responseMock);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = new ResetPasswordDto();
    resetPasswordDto.email = 'email';

    it('should call resetPassword service', async () => {
      const resetPasswordSpy = jest.spyOn(service, 'resetPassword');
      await controller.resetPassword(resetPasswordDto);
      expect(resetPasswordSpy).toBeCalledWith(resetPasswordDto.email);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(service, 'resetPassword').mockRejectedValueOnce(notFoundError);
      try {
        await controller.resetPassword(resetPasswordDto);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should throw InternalServerErrorException on any other error', async () => {
      jest.spyOn(service, 'resetPassword').mockRejectedValueOnce(null);
      try {
        await controller.resetPassword(resetPasswordDto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('updatePassword', () => {
    const updatePasswordDto = new UpdatePasswordDto();
    updatePasswordDto.password = 'password';
    const code = 'code';

    it('should call updatePassword service', async () => {
      const updatePasswordSpy = jest.spyOn(service, 'updatePassword');
      await controller.updatePassword(code, updatePasswordDto);
      expect(updatePasswordSpy).toBeCalledWith(
        code,
        updatePasswordDto.password,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      jest
        .spyOn(service, 'updatePassword')
        .mockRejectedValueOnce(notFoundError);
      try {
        await controller.updatePassword(code, updatePasswordDto);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should throw BadRequestException on any other error', async () => {
      jest.spyOn(service, 'resetPassword').mockRejectedValueOnce(null);
      try {
        await controller.updatePassword(code, updatePasswordDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('logout', () => {
    const responseMock = {
      clearCookie: jest.fn(),
    };

    const requestMock = {
      user: {
        id: 1,
        email: 'email',
      },
    };

    it('should call logout service', async () => {
      await controller.logout(requestMock, responseMock);
      expect(service.logout).toBeCalledWith(requestMock.user);
      expect(responseMock.clearCookie).toBeCalledTimes(1);
    });

    it('should throw BadRequestException on any error', async () => {
      jest.spyOn(service, 'logout').mockRejectedValueOnce(null);
      try {
        await controller.logout(requestMock, responseMock);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });
  });
});
