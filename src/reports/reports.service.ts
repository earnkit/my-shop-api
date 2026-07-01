import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { LowStockProductsQueryDto } from './dto/low-stock-products-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(query: DateRangeQueryDto) {
    const orderDateWhere = this.getOrderDateWhere(query);
    const orderWhere: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...orderDateWhere,
    };
    const salesWhere: Prisma.OrderWhereInput = {
      ...orderWhere,
      status: { not: OrderStatus.CANCELLED },
    };

    const [
      totalUsers,
      totalCategories,
      totalProducts,
      totalOrders,
      totalSales,
      lowStockProducts,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.category.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.order.count({ where: orderWhere }),
      this.prisma.order.aggregate({
        where: salesWhere,
        _sum: { totalAmount: true },
      }),
      this.prisma.product.count({
        where: {
          deletedAt: null,
          status: ProductStatus.ACTIVE,
          stock: { lte: 5 },
        },
      }),
    ]);

    return {
      totalUsers,
      totalCategories,
      totalProducts,
      totalOrders,
      totalSalesAmount: totalSales._sum.totalAmount ?? 0,
      lowStockProducts,
    };
  }

  getLowStockProducts(query: LowStockProductsQueryDto) {
    const threshold = query.threshold ?? 5;
    const limit = query.limit ?? 10;

    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
        status: ProductStatus.ACTIVE,
        stock: { lte: threshold },
      },
      orderBy: { stock: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        status: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getOrderStatusSummary(query: DateRangeQueryDto) {
    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
        ...this.getOrderDateWhere(query),
      },
      _count: true,
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count,
    }));
  }

  private getOrderDateWhere(
    query: DateRangeQueryDto,
  ): Pick<Prisma.OrderWhereInput, 'createdAt'> {
    if (!query.startDate && !query.endDate) {
      return {};
    }

    const createdAt: Prisma.DateTimeFilter = {};

    if (query.startDate) {
      createdAt.gte = new Date(query.startDate);
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setUTCHours(23, 59, 59, 999);
      createdAt.lte = endDate;
    }

    return { createdAt };
  }
}
