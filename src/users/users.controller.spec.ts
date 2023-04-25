import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Prisma, User } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaErrorCodes } from '../types';
import { GeneratePdfDto } from './dto/generate-pdf.dto';

jest.mock('./users.service.ts');

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  const user: Omit<User, 'password'> = {
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
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAll service and return an array of users', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([userInDB]);
      expect(await controller.findAll()).toEqual([user]);
    });
  });

  describe('findOne', () => {
    it('should call findOne service and return the user', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(userInDB);
      expect(await controller.findOne(user.id)).toEqual(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValueOnce(null);
      try {
        await controller.findOne(user.id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('update', () => {
    const updateUserDto = new UpdateUserDto();
    const image = {} as Express.Multer.File;

    it('should call update service and return updated user', async () => {
      jest.spyOn(service, 'update').mockResolvedValueOnce(userInDB);
      expect(await controller.update(image, user.id, updateUserDto)).toEqual(
        user,
      );
    });

    it('should throw BadRequestException when email is not unique', async () => {
      jest.spyOn(service, 'update').mockRejectedValueOnce(notUniqueError);
      try {
        await controller.update(image, user.id, updateUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(service, 'update').mockRejectedValueOnce(notFoundError);
      try {
        await controller.update(image, user.id, updateUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should throw BadRequestException in case of any other error', async () => {
      jest.spyOn(service, 'update').mockRejectedValueOnce(null);
      try {
        await controller.update(image, user.id, updateUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('remove', () => {
    it('should call remove service', async () => {
      const removeSpy = jest.spyOn(service, 'remove');
      await controller.remove(user.id);
      expect(removeSpy).toBeCalledWith(user.id);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(service, 'remove').mockRejectedValueOnce(null);
      try {
        await controller.remove(user.id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('generate', () => {
    const generatePdfDto = new GeneratePdfDto();
    it('should call generate service and return status', async () => {
      jest.spyOn(service, 'generate').mockResolvedValueOnce(true);
      expect(await controller.generate(generatePdfDto)).toEqual({
        status: true,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(service, 'generate').mockRejectedValueOnce(notFoundError);
      try {
        await controller.generate(generatePdfDto);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should return status false on any other errors', async () => {
      jest.spyOn(service, 'generate').mockRejectedValueOnce(null);
      expect(await controller.generate(generatePdfDto)).toEqual({
        status: false,
      });
    });
  });
});
