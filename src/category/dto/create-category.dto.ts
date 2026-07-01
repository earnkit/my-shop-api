import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'The name of the category' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'The description of the category',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
