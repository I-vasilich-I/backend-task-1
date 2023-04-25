import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { UsersService } from './users.service';
import { PrismaClient, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as helpers from '../helpers';

describe('UsersService', () => {
  let service: UsersService;
  const prismaMock = mockDeep<PrismaClient>();
  let prisma: DeepMockProxy<PrismaClient>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
    mockReset(prismaMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = new CreateUserDto();

    it('should return created user', async () => {
      prisma.user.create.mockResolvedValueOnce(userInDB);
      expect(await service.create(createUserDto)).toEqual(userInDB);
    });

    it('should throw if user has not been created', async () => {
      prisma.user.create.mockRejectedValueOnce(new Error());
      try {
        await service.create(createUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      prisma.user.findMany.mockResolvedValueOnce([userInDB]);
      expect(await service.findAll()).toEqual([userInDB]);
    });
  });

  describe('findOne', () => {
    it('should return the user', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce(userInDB);
      expect(await service.findOne(userInDB.id)).toEqual(userInDB);
    });

    it('should throw when user not found', async () => {
      prisma.user.findUniqueOrThrow.mockRejectedValueOnce(new Error());
      try {
        await service.findOne(userInDB.id);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('update', () => {
    const updateUserDto = new UpdateUserDto();
    const image = {} as Express.Multer.File;

    it('should return updated user', async () => {
      jest.spyOn(helpers, 'convertImageToString').mockReturnValueOnce('');
      prisma.user.update.mockResolvedValueOnce(userInDB);
      expect(await service.update(userInDB.id, updateUserDto, image)).toEqual(
        userInDB,
      );
    });

    it('should throw if user has not been updated', async () => {
      prisma.user.update.mockRejectedValueOnce(new Error());
      try {
        await service.update(userInDB.id, updateUserDto, image);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should call prisma update with image from json body', async () => {
      const updateUserDto = new UpdateUserDto();
      updateUserDto.image = 'image-from-json';

      await service.update(userInDB.id, updateUserDto);
      expect(prisma.user.update).toBeCalledWith({
        where: { id: userInDB.id },
        data: updateUserDto,
      });
    });

    it('should call prisma update with image from form-data body', async () => {
      const updateUserDto = new UpdateUserDto();
      updateUserDto.image = '';
      const imageString = 'image-from-form-data';
      jest
        .spyOn(helpers, 'convertImageToString')
        .mockReturnValueOnce(imageString);

      await service.update(userInDB.id, updateUserDto, image);
      expect(prisma.user.update).toBeCalledWith({
        where: { id: userInDB.id },
        data: { ...updateUserDto, image: imageString },
      });
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      prisma.user.delete.mockResolvedValueOnce(userInDB);
      expect(await service.remove(userInDB.id)).toBe(undefined);
    });

    it('should throw when user not found', async () => {
      prisma.user.delete.mockRejectedValueOnce(new Error());
      try {
        await service.remove(userInDB.id);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('generate', () => {
    it('should throw when user not found', async () => {
      prisma.user.findUniqueOrThrow.mockRejectedValueOnce(new Error());
      try {
        await service.generate(userInDB.email);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should return false when pdf data has not been generated', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce(userInDB);
      jest.spyOn(helpers, 'generatePdfData').mockRejectedValueOnce(null);
      expect(await service.generate(userInDB.email)).toBe(false);
    });

    it('should return false when user has not been updated', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce(userInDB);
      jest
        .spyOn(helpers, 'generatePdfData')
        .mockResolvedValueOnce(Buffer.from([1, 2, 3]));
      prisma.user.update.mockRejectedValueOnce(null);
      expect(await service.generate(userInDB.email)).toBe(false);
    });

    it('should return true on success', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce(userInDB);
      jest
        .spyOn(helpers, 'generatePdfData')
        .mockResolvedValueOnce(Buffer.from([1, 2, 3]));
      prisma.user.update.mockResolvedValueOnce(userInDB);
      expect(await service.generate(userInDB.email)).toBe(true);
    });
  });
});
