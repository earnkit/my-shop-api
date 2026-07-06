import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, ProductStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let prisma: {
    $transaction: jest.Mock;
    user: {
      findFirst: jest.Mock;
    };
    product: {
      findMany: jest.Mock;
      update: jest.Mock;
    };
    order: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const user = {
    id: 1,
    name: 'Earn',
    email: 'earn@example.com',
    password: 'secret',
    tel: null,
    image: null,
    role: Role.CUSTOMER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };
  const product = {
    id: 1,
    name: 'Coffee',
    description: null,
    price: 60,
    stock: 10,
    image: null,
    status: ProductStatus.ACTIVE,
    categoryId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };
  const order = {
    id: 1,
    userId: 1,
    totalAmount: 120,
    status: OrderStatus.PENDING,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    user,
    items: [
      {
        id: 1,
        orderId: 1,
        productId: 1,
        quantity: 2,
        price: 60,
        subtotal: 120,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        product,
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((callback) => callback(prisma)),
      user: {
        findFirst: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      order: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an order and decrement stock', async () => {
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.product.findMany.mockResolvedValue([product]);
    prisma.order.create.mockResolvedValue(order);
    prisma.product.update.mockResolvedValue(product);

    await expect(
      service.create({ userId: 1, items: [{ productId: 1, quantity: 2 }] }),
    ).resolves.toEqual(order);
    expect(prisma.order.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        totalAmount: 120,
        items: {
          create: [
            {
              productId: 1,
              quantity: 2,
              price: 60,
              subtotal: 120,
            },
          ],
        },
      },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    });
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { stock: { decrement: 2 } },
    });
  });

  it('should create an order for a user from token and decrement stock', async () => {
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.product.findMany.mockResolvedValue([product]);
    prisma.order.create.mockResolvedValue(order);
    prisma.product.update.mockResolvedValue(product);

    await expect(
      service.createForUser(1, {
        items: [{ productId: 1, quantity: 2 }],
      }),
    ).resolves.toEqual(order);
    expect(prisma.order.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        totalAmount: 120,
        items: {
          create: [
            {
              productId: 1,
              quantity: 2,
              price: 60,
              subtotal: 120,
            },
          ],
        },
      },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    });
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { stock: { decrement: 2 } },
    });
  });

  it('should get orders for a user', async () => {
    prisma.order.findMany.mockResolvedValue([order]);
    prisma.order.count.mockResolvedValue(1);

    await expect(service.getMyOrders(1)).resolves.toEqual({
      data: [order],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: { userId: 1, deletedAt: null },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should filter orders for a user by status and date', async () => {
    prisma.order.findMany.mockResolvedValue([order]);
    prisma.order.count.mockResolvedValue(1);

    await service.getMyOrders(1, {
      status: OrderStatus.PAID,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      page: 2,
      limit: 5,
    });

    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: {
        userId: 1,
        deletedAt: null,
        createdAt: {
          gte: new Date('2026-06-30T17:00:00.000Z'),
          lte: new Date('2026-07-31T16:59:59.999Z'),
        },
        status: OrderStatus.PAID,
      },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
    });
  });

  it('should get orders', async () => {
    prisma.order.findMany.mockResolvedValue([order]);
    prisma.order.count.mockResolvedValue(1);

    await expect(service.getOrders()).resolves.toEqual({
      data: [order],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should filter orders by status, date, product, user, and search', async () => {
    prisma.order.findMany.mockResolvedValue([order]);
    prisma.order.count.mockResolvedValue(1);

    await service.getOrders({
      search: 'earn',
      status: OrderStatus.PAID,
      startDate: '2026-07-01',
      endDate: '2026-07-06',
      productId: 1,
      userId: 1,
      sortBy: 'totalAmount',
      sortOrder: 'asc',
    });

    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        createdAt: {
          gte: new Date('2026-06-30T17:00:00.000Z'),
          lte: new Date('2026-07-06T16:59:59.999Z'),
        },
        status: OrderStatus.PAID,
        items: { some: { productId: 1 } },
        userId: 1,
        OR: [
          { user: { name: { contains: 'earn', mode: 'insensitive' } } },
          { user: { email: { contains: 'earn', mode: 'insensitive' } } },
        ],
      },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { totalAmount: 'asc' },
      skip: 0,
      take: 10,
    });
  });

  it('should get order detail', async () => {
    prisma.order.findFirst.mockResolvedValue(order);

    await expect(service.getOrderDetail(1)).resolves.toEqual(order);
  });

  it('should update order status', async () => {
    prisma.order.findFirst.mockResolvedValue(order);
    prisma.order.update.mockResolvedValue({
      ...order,
      status: OrderStatus.PAID,
    });

    await expect(
      service.updateStatus(1, { status: OrderStatus.PAID }),
    ).resolves.toEqual({ ...order, status: OrderStatus.PAID });
  });
});
