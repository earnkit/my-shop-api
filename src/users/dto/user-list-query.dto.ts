import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export const USER_SORT_FIELDS = ['createdAt', 'name', 'email', 'role'] as const;

export class UserListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: USER_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  sortBy?: (typeof USER_SORT_FIELDS)[number];
}
