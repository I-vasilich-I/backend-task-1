import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string | null;

  @IsString()
  @IsOptional()
  resetCode?: string | null;
}
