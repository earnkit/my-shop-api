import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateOrderItemDto } from './create-order.dto';

export class CreateMyOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
