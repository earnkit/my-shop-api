import { ProductStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'The name of the product' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'The description of the product',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'The price of the product', minimum: 0 })
  @IsInt()
  @Min(0)
  price!: number;

  @ApiProperty({
    description: 'The stock quantity of the product',
    minimum: 0,
    required: false,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiProperty({ description: 'The image URL of the product', required: false })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'The status of the product',
    enum: ProductStatus,
    required: false,
    default: ProductStatus.ACTIVE,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiProperty({ description: 'The category ID of the product' })
  @IsInt()
  @Min(1)
  categoryId!: number;
}
