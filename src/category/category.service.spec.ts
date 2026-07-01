import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: {
    category: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
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

    await expect(service.findAll()).resolves.toEqual([category]);
  });

  it('should create a category', async () => {
    const dto = { name: 'Drinks', description: 'Drink products' };
    prisma.category.create.mockResolvedValue(category);

    await expect(service.create(dto)).resolves.toEqual(category);
    expect(prisma.category.create).toHaveBeenCalledWith({ data: dto });
  });

  it('should update a category', async () => {
    prisma.category.findFirst.mockResolvedValue(category);
    prisma.category.update.mockResolvedValue({ ...category, name: 'Food' });

    await expect(service.update(1, { name: 'Food' })).resolves.toEqual({
      ...category,
      name: 'Food',
    });
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
