import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  ValidateNested,
  Min,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'The product ID', minimum: 1 })
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty({ description: 'The product quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'The user ID', minimum: 1 })
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
