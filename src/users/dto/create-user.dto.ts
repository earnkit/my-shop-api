import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'The name of the user' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'The email of the user' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'The password of the user' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'The telephone number of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  tel?: string;

  @ApiProperty({ description: 'The image URL of the user', required: false })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'The role of the user',
    enum: Role,
    required: false,
    default: Role.CUSTOMER,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
