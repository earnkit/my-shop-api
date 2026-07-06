import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    category: {
      findFirst: jest.Mock;
    };
  };

  const category = {
    id: 1,
    name: 'Drinks',
    description: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };
  const product = {
    id: 1,
    name: 'Coffee',
    description: 'Hot coffee',
    price: 60,
    stock: 10,
    image: null,
    status: ProductStatus.ACTIVE,
    categoryId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      category: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all products', async () => {
    prisma.product.findMany.mockResolvedValue([product]);
    prisma.product.count.mockResolvedValue(1);

    await expect(service.findAll()).resolves.toEqual({
      data: [product],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should filter products by search, category, status, price, and low stock', async () => {
    prisma.product.findMany.mockResolvedValue([product]);
    prisma.product.count.mockResolvedValue(1);

    await service.findAll({
      search: 'coffee',
      categoryId: 1,
      status: ProductStatus.ACTIVE,
      minPrice: 50,
      maxPrice: 100,
      lowStock: true,
      sortBy: 'price',
      sortOrder: 'asc',
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        categoryId: 1,
        status: ProductStatus.ACTIVE,
        price: { gte: 50, lte: 100 },
        stock: { lte: 5 },
        OR: [
          { name: { contains: 'coffee', mode: 'insensitive' } },
          { description: { contains: 'coffee', mode: 'insensitive' } },
          {
            category: { name: { contains: 'coffee', mode: 'insensitive' } },
          },
        ],
      },
      include: { category: true },
      orderBy: { price: 'asc' },
      skip: 0,
      take: 10,
    });
  });

  it('should create a product when category exists', async () => {
    const dto = { name: 'Coffee', price: 60, stock: 10, categoryId: 1 };
    prisma.category.findFirst.mockResolvedValue(category);
    prisma.product.create.mockResolvedValue(product);

    await expect(service.create(dto)).resolves.toEqual(product);
  });

  it('should update product stock/status/category', async () => {
    prisma.product.findFirst.mockResolvedValue(product);
    prisma.category.findFirst.mockResolvedValue(category);
    prisma.product.update.mockResolvedValue({
      ...product,
      stock: 5,
      status: ProductStatus.INACTIVE,
    });

    await expect(
      service.update(1, {
        stock: 5,
        status: ProductStatus.INACTIVE,
        categoryId: 1,
      }),
    ).resolves.toEqual({
      ...product,
      stock: 5,
      status: ProductStatus.INACTIVE,
    });
  });

  it('should soft delete a product', async () => {
    prisma.product.findFirst.mockResolvedValue(product);
    prisma.product.update.mockResolvedValue({
      ...product,
      deletedAt: expect.any(Date),
    });

    await service.delete(1);
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { deletedAt: expect.any(Date) },
      include: { category: true },
    });
  });
});
