import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateMyOrderDto } from './dto/create-my-order.dto';
import { OrderListQueryDto } from './dto/order-list-query.dto';
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

  @Post('my-orders')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order for authenticated customer' })
  createMyOrder(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateMyOrderDto,
  ) {
    return this.orderService.createForUser(request.user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'Find all orders' })
  getOrders(@Query() query: OrderListQueryDto) {
    return this.orderService.getOrders(query);
  }

  @Get('my-orders')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find orders for authenticated customer' })
  getMyOrders(
    @Req() request: AuthenticatedRequest,
    @Query() query: OrderListQueryDto,
  ) {
    return this.orderService.getMyOrders(request.user.id, query);
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
