import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { convertImageToString, generatePdfData } from '../helpers';
import { Prisma, User } from '@prisma/client';
import { TEMPLATES } from '../constants';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.create({ data: createUserDto });
    return user;
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users;
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    return user;
  }

  async findOneByProps(props: Partial<User>) {
    const user = await this.prisma.user.findFirst({
      where: { ...props },
    });

    return user ?? null;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    image?: Express.Multer.File,
  ) {
    // in case form-data was sent with empty image field(file is not selected),
    // it'll be parsed into body and extracted from it to updateUserDto,
    // then we don't want it to be written into database.
    const { image: img, ...rest } = updateUserDto;
    const data: Prisma.UserUpdateArgs['data'] = { ...rest };
    // in case update data was sent through json body we might save it if it's truthy.
    if (img) {
      data.image = img;
    }

    if (image) {
      data.image = convertImageToString(image);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return user;
  }

  async remove(id: number) {
    await this.prisma.user.delete({ where: { id } });
  }

  async generate(email: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { email } });

    try {
      const data = {
        fullName: `${user.firstName} ${user.lastName}`,
        image: user.image ?? '',
      };
      const pdfBuffer = await generatePdfData(data, TEMPLATES.PDF);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { pdf: pdfBuffer },
      });

      return true;
    } catch (error) {
      return false;
    }
  }
}
