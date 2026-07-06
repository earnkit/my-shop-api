import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export const CATEGORY_SORT_FIELDS = ['createdAt', 'name'] as const;

export class CategoryListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CATEGORY_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(CATEGORY_SORT_FIELDS)
  sortBy?: (typeof CATEGORY_SORT_FIELDS)[number];
}
