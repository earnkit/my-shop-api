import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { getBangkokDateRangeWhere } from '../common/date-range';
import { getPagination, toPaginatedResponse } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMyOrderDto } from './dto/create-my-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateOrderDto) {
    return this.createWithUserId(body.userId, body);
  }

  async createForUser(userId: number, body: CreateMyOrderDto) {
    return this.createWithUserId(userId, body);
  }

  private async createWithUserId(
    userId: number,
    body: Pick<CreateOrderDto, 'items'>,
  ) {
    await this.ensureUserExists(userId);

    const quantityByProductId = body.items.reduce((acc, item) => {
      acc.set(item.productId, (acc.get(item.productId) ?? 0) + item.quantity);
      return acc;
    }, new Map<number, number>());
    const productIds = [...quantityByProductId.keys()];
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null,
        status: ProductStatus.ACTIVE,
      },
    });

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const orderItems = body.items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new NotFoundException(
          `Product with id ${item.productId} not found`,
        );
      }

      const requestedQuantity = quantityByProductId.get(item.productId) ?? 0;

      if (product.stock < requestedQuantity) {
        throw new BadRequestException(
          `Product with id ${item.productId} has insufficient stock`,
        );
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        subtotal: product.price * item.quantity,
      };
    });
    const totalAmount = orderItems.reduce(
      (total, item) => total + item.subtotal,
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          items: {
            create: orderItems,
          },
        },
        include: {
          user: true,
          items: {
            include: { product: true },
          },
        },
      });

      await Promise.all(
        body.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          }),
        ),
      );

      return order;
    });
  }

  async getMyOrders(userId: number, query: OrderListQueryDto = {}) {
    const { page, limit, skip } = getPagination(query);
    const where: Prisma.OrderWhereInput = {
      userId,
      deletedAt: null,
      ...getBangkokDateRangeWhere(query),
      ...(query.status && { status: query.status }),
    };
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: { product: true },
          },
        },
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return toPaginatedResponse(orders, { page, limit }, total);
  }

  async getOrders(query: OrderListQueryDto = {}) {
    const { page, limit, skip } = getPagination(query);
    const search = query.search;
    const orderId = search && /^\d+$/.test(search) ? Number(search) : undefined;
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...getBangkokDateRangeWhere(query),
      ...(query.status && { status: query.status }),
      ...(query.productId && {
        items: {
          some: {
            productId: query.productId,
          },
        },
      }),
      ...(query.userId && { userId: query.userId }),
      ...(search && {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };
    const include = {
      user: true,
      items: {
        include: { product: true },
      },
    };
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return toPaginatedResponse(orders, { page, limit }, total);
  }

  async getOrderDetail(id: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: this.parseId(id),
        deletedAt: null,
      },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return order;
  }

  async updateStatus(id: number, body: UpdateOrderStatusDto) {
    await this.getOrderDetail(id);

    return this.prisma.order.update({
      where: { id: this.parseId(id) },
      data: { status: body.status },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    });
  }

  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
  }

  private parseId(id: number) {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('Order id must be a positive integer');
    }

    return id;
  }
}
