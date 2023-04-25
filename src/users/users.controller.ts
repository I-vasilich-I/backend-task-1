import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  NotFoundException,
  ParseIntPipe,
  Put,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { EXCEPTION_MESSAGES, MAX_IMAGE_SIZE_BITES } from '../constants';
import { handleGenerateError, handleUpdateError } from '../error-handlers';
import { exclude, imageFileFilter } from '../helpers';
import { GeneratePdfDto } from './dto/generate-pdf.dto';
import { User } from '@prisma/client';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';

function getResponseUser(user: User) {
  return exclude(user, ['password']);
}

const storage = memoryStorage();

const parseFilePipe = new ParseFilePipe({
  validators: [new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE_BITES })],
  fileIsRequired: false,
});

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // CRUD

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => getResponseUser(user));
  }

  @Get(':id')
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    try {
      const user = await this.usersService.findOne(id);
      return getResponseUser(user);
    } catch (error) {
      throw new NotFoundException(
        EXCEPTION_MESSAGES.ENTITY_NOT_FOUND('User', id),
      );
    }
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('image', { storage, fileFilter: imageFileFilter }),
  )
  async update(
    @UploadedFile(parseFilePipe)
    image: Express.Multer.File,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const user = await this.usersService.update(id, updateUserDto, image);
      return getResponseUser(user);
    } catch (error) {
      handleUpdateError(error, 'User', id);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ParseIntPipe()) id: number) {
    try {
      await this.usersService.remove(id);
    } catch (error) {
      throw new NotFoundException(
        EXCEPTION_MESSAGES.ENTITY_NOT_FOUND('User', id),
      );
    }
  }

  // Generate

  @Post('generate')
  async generate(@Body() { email }: GeneratePdfDto) {
    try {
      const status = await this.usersService.generate(email);
      return { status };
    } catch (error) {
      handleGenerateError(error, email);
    }

    return { status: false };
  }
}
