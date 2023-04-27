import { IsNotEmpty, IsEmail } from 'class-validator';

export class GeneratePdfDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
