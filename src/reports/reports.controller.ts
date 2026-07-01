import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { LowStockProductsQueryDto } from './dto/low-stock-products-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary report' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getSummary(@Query() query: DateRangeQueryDto) {
    return this.reportsService.getSummary(query);
  }

  @Get('low-stock-products')
  @ApiOperation({ summary: 'Get low stock products report' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLowStockProducts(@Query() query: LowStockProductsQueryDto) {
    return this.reportsService.getLowStockProducts(query);
  }

  @Get('order-status-summary')
  @ApiOperation({ summary: 'Get order status summary report' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getOrderStatusSummary(@Query() query: DateRangeQueryDto) {
    return this.reportsService.getOrderStatusSummary(query);
  }
}
