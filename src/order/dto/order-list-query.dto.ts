import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export const ORDER_SORT_FIELDS = ['createdAt', 'totalAmount', 'status'] as const;

export class OrderListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Start date for order lists in YYYY-MM-DD format',
    example: '2026-07-01',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for order lists in YYYY-MM-DD format',
    example: '2026-07-06',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ enum: ORDER_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(ORDER_SORT_FIELDS)
  sortBy?: (typeof ORDER_SORT_FIELDS)[number];
}
