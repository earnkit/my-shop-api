import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, ProductStatus } from '@prisma/client';
import { getBangkokDateRangeWhere } from '../common/date-range';
import { getPagination } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { LowStockProductsQueryDto } from './dto/low-stock-products-query.dto';
import { OrderReportQueryDto } from './dto/order-report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(query: DateRangeQueryDto) {
    const orderDateWhere = getBangkokDateRangeWhere(query);
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

  async getOrders(query: OrderReportQueryDto) {
    const { page, limit, skip } = getPagination(query);
    const where = this.getOrderReportWhere(query);

    const [orders, total, aggregate] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      data: orders.map((order) => ({
        id: order.id,
        customerName: order.user.name,
        customerEmail: order.user.email,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalOrders: total,
        totalAmount: aggregate._sum.totalAmount ?? 0,
      },
    };
  }

  async exportOrdersCsv(query: OrderReportQueryDto) {
    const orders = await this.prisma.order.findMany({
      where: this.getOrderReportWhere(query),
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
    });
    const rows = orders.map((order) => [
      order.id,
      order.user.name,
      order.user.email,
      order.status,
      order.createdAt.toISOString(),
      order.items.map((item) => item.product.name).join(' | '),
      order.items.map((item) => item.quantity).join(' | '),
      order.totalAmount,
    ]);

    return [
      [
        'Order ID',
        'Customer',
        'Email',
        'Status',
        'Created At',
        'Products',
        'Quantities',
        'Total',
      ].join(','),
      ...rows.map((row) => row.map((value) => this.escapeCsv(value)).join(',')),
    ].join('\n');
  }

  async getOrderStatusSummary(query: DateRangeQueryDto) {
    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
        ...getBangkokDateRangeWhere(query),
      },
      _count: true,
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count,
    }));
  }

  private getOrderReportWhere(query: OrderReportQueryDto) {
    const search = query.search;
    const orderId = search && /^\d+$/.test(search) ? Number(search) : undefined;

    return {
      deletedAt: null,
      ...getBangkokDateRangeWhere(query),
      ...(query.productId && {
        items: {
          some: {
            productId: query.productId,
          },
        },
      }),
      ...(query.userId && { userId: query.userId }),
      ...(query.status && { status: query.status }),
      ...(search && {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    } satisfies Prisma.OrderWhereInput;
  }

  private escapeCsv(value: string | number) {
    const text = String(value);

    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  }
}
