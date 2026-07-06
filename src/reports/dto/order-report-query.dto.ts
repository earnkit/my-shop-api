import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { SORT_ORDERS } from '../../common/dto/pagination-query.dto';
import type { SortOrder } from '../../common/dto/pagination-query.dto';
import { ORDER_SORT_FIELDS } from '../../order/dto/order-list-query.dto';

export class OrderReportQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    default: 10,
    minimum: 1,
    description:
      'Page size. Reports allow large limits so CSV exports can request all filtered rows.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Keyword search' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'desc' })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: SortOrder;

  @ApiPropertyOptional({
    description: 'Start date for order reports in YYYY-MM-DD format',
    example: '2026-07-01',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for order reports in YYYY-MM-DD format',
    example: '2026-07-06',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter orders that contain this product',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId?: number;

  @ApiPropertyOptional({
    description: 'Filter orders from this user',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({
    description: 'Filter orders by status',
    enum: OrderStatus,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: ORDER_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(ORDER_SORT_FIELDS)
  sortBy?: (typeof ORDER_SORT_FIELDS)[number];
}
