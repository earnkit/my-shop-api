import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: {
    user: { count: jest.Mock };
    category: { count: jest.Mock };
    product: { count: jest.Mock; findMany: jest.Mock };
    order: { count: jest.Mock; aggregate: jest.Mock; groupBy: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { count: jest.fn() },
      category: { count: jest.fn() },
      product: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      order: {
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return summary with total counts and totalSalesAmount', async () => {
    prisma.user.count.mockResolvedValue(12);
    prisma.category.count.mockResolvedValue(5);
    prisma.product.count.mockResolvedValueOnce(30).mockResolvedValueOnce(4);
    prisma.order.count.mockResolvedValue(18);
    prisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 25900 } });

    await expect(service.getSummary({})).resolves.toEqual({
      totalUsers: 12,
      totalCategories: 5,
      totalProducts: 30,
      totalOrders: 18,
      totalSalesAmount: 25900,
      lowStockProducts: 4,
    });
    expect(prisma.order.aggregate).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        status: { not: OrderStatus.CANCELLED },
      },
      _sum: { totalAmount: true },
    });
  });

  it('should return totalSalesAmount as 0 when aggregate sum is null', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.category.count.mockResolvedValue(0);
    prisma.product.count.mockResolvedValue(0);
    prisma.order.count.mockResolvedValue(0);
    prisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: null } });

    await expect(service.getSummary({})).resolves.toMatchObject({
      totalSalesAmount: 0,
    });
  });

  it('should apply date filter for order-related summary fields', async () => {
    prisma.user.count.mockResolvedValue(1);
    prisma.category.count.mockResolvedValue(1);
    prisma.product.count.mockResolvedValue(1);
    prisma.order.count.mockResolvedValue(1);
    prisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 100 } });

    await service.getSummary({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });

    const createdAt = {
      gte: new Date('2026-01-01'),
      lte: new Date('2026-01-31T23:59:59.999Z'),
    };
    expect(prisma.order.count).toHaveBeenCalledWith({
      where: { deletedAt: null, createdAt },
    });
    expect(prisma.order.aggregate).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        createdAt,
        status: { not: OrderStatus.CANCELLED },
      },
      _sum: { totalAmount: true },
    });
  });

  it('should return low stock products using default threshold 5 and limit 10', async () => {
    prisma.product.findMany.mockResolvedValue([]);

    await expect(service.getLowStockProducts({})).resolves.toEqual([]);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        status: ProductStatus.ACTIVE,
        stock: { lte: 5 },
      },
      orderBy: { stock: 'asc' },
      take: 10,
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
  });

  it('should return low stock products using custom threshold/limit', async () => {
    const products = [
      {
        id: 1,
        name: 'Mechanical Keyboard',
        price: 1200,
        stock: 3,
        status: ProductStatus.ACTIVE,
        category: { id: 2, name: 'Computer Accessories' },
      },
    ];
    prisma.product.findMany.mockResolvedValue(products);

    await expect(
      service.getLowStockProducts({ threshold: 3, limit: 5 }),
    ).resolves.toEqual(products);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ stock: { lte: 3 } }),
        take: 5,
      }),
    );
  });

  it('should return order status summary grouped by status', async () => {
    prisma.order.groupBy.mockResolvedValue([
      { status: OrderStatus.PENDING, _count: 5 },
      { status: OrderStatus.PAID, _count: 8 },
    ]);

    await expect(service.getOrderStatusSummary({})).resolves.toEqual([
      { status: OrderStatus.PENDING, count: 5 },
      { status: OrderStatus.PAID, count: 8 },
    ]);
    expect(prisma.order.groupBy).toHaveBeenCalledWith({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });
  });

  it('should apply date filter to order status summary', async () => {
    prisma.order.groupBy.mockResolvedValue([
      { status: OrderStatus.SHIPPED, _count: 4 },
    ]);

    await service.getOrderStatusSummary({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });

    expect(prisma.order.groupBy).toHaveBeenCalledWith({
      by: ['status'],
      where: {
        deletedAt: null,
        createdAt: {
          gte: new Date('2026-02-01'),
          lte: new Date('2026-02-28T23:59:59.999Z'),
        },
      },
      _count: true,
    });
  });
});
