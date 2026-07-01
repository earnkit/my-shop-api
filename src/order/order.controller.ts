import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  create(@Body() body: CreateOrderDto) {
    return this.orderService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Find all orders' })
  getOrders() {
    return this.orderService.getOrders();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find an order by ID' })
  getOrderDetail(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.getOrderDetail(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, body);
  }
}
