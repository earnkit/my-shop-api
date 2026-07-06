import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { LowStockProductsQueryDto } from './dto/low-stock-products-query.dto';
import { OrderReportQueryDto } from './dto/order-report-query.dto';
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

  @Get('orders')
  @ApiOperation({ summary: 'Get order list report' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getOrders(@Query() query: OrderReportQueryDto) {
    return this.reportsService.getOrders(query);
  }

  @Get('orders/export')
  @ApiOperation({ summary: 'Export order report as CSV' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async exportOrders(
    @Query() query: OrderReportQueryDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const csv = await this.reportsService.exportOrdersCsv(query);

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.getOrderReportFilename(query)}"`,
    );

    return csv;
  }

  @Get('order-status-summary')
  @ApiOperation({ summary: 'Get order status summary report' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getOrderStatusSummary(@Query() query: DateRangeQueryDto) {
    return this.reportsService.getOrderStatusSummary(query);
  }

  private getOrderReportFilename(query: OrderReportQueryDto) {
    const date = query.endDate ?? new Date().toISOString().slice(0, 10);

    return `order-report-${date}.csv`;
  }
}
