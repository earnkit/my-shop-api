import { OrderStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'The status of the order', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
