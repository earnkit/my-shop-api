import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export const PRODUCT_SORT_FIELDS = [
  'createdAt',
  'name',
  'price',
  'stock',
  'status',
] as const;

export class ProductListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter products with stock <= 5' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lowStock?: boolean;

  @ApiPropertyOptional({ enum: PRODUCT_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(PRODUCT_SORT_FIELDS)
  sortBy?: (typeof PRODUCT_SORT_FIELDS)[number];
}
