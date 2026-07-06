import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: {
    category: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const category = {
    id: 1,
    name: 'Drinks',
    description: 'Drink products',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all categories', async () => {
    prisma.category.findMany.mockResolvedValue([category]);
    prisma.category.count.mockResolvedValue(1);

    await expect(service.findAll()).resolves.toEqual({
      data: [category],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('should filter categories by search and sort by name', async () => {
    prisma.category.findMany.mockResolvedValue([category]);
    prisma.category.count.mockResolvedValue(1);

    await service.findAll({
      search: 'drink',
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: 'drink', mode: 'insensitive' } },
          { description: { contains: 'drink', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      skip: 0,
      take: 10,
    });
  });

  it('should create a category', async () => {
    const dto = { name: 'Drinks', description: 'Drink products' };
    prisma.category.findFirst.mockResolvedValue(null);
    prisma.category.create.mockResolvedValue(category);

    await expect(service.create(dto)).resolves.toEqual(category);
    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { name: dto.name, deletedAt: null },
    });
    expect(prisma.category.create).toHaveBeenCalledWith({ data: dto });
  });

  it('should throw ConflictException when an active category has the same name', async () => {
    const dto = { name: 'Drinks', description: 'Drink products' };
    prisma.category.findFirst.mockResolvedValue(category);

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it('should update a category', async () => {
    prisma.category.findFirst
      .mockResolvedValueOnce(category)
      .mockResolvedValueOnce(null);
    prisma.category.update.mockResolvedValue({ ...category, name: 'Food' });

    await expect(service.update(1, { name: 'Food' })).resolves.toEqual({
      ...category,
      name: 'Food',
    });
    expect(prisma.category.findFirst).toHaveBeenLastCalledWith({
      where: { name: 'Food', deletedAt: null, NOT: { id: 1 } },
    });
  });

  it('should throw ConflictException when updating to an active category name', async () => {
    prisma.category.findFirst
      .mockResolvedValueOnce(category)
      .mockResolvedValueOnce({ ...category, id: 2 });

    await expect(service.update(1, { name: 'Food' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.category.update).not.toHaveBeenCalled();
  });

  it('should soft delete a category', async () => {
    prisma.category.findFirst.mockResolvedValue(category);
    prisma.category.update.mockResolvedValue({
      ...category,
      deletedAt: expect.any(Date),
    });

    await service.delete(1);
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
