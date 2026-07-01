import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

describe('CategoryController', () => {
  let controller: CategoryController;
  let categoryService: {
    findAll: jest.Mock;
    getById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
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
    categoryService = {
      findAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: categoryService,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate category actions to service', async () => {
    categoryService.findAll.mockResolvedValue([category]);
    categoryService.getById.mockResolvedValue(category);
    categoryService.create.mockResolvedValue(category);
    categoryService.update.mockResolvedValue({ ...category, name: 'Food' });
    categoryService.delete.mockResolvedValue(category);

    await expect(controller.findAll()).resolves.toEqual([category]);
    await expect(controller.getById(1)).resolves.toEqual(category);
    await expect(controller.create({ name: 'Drinks' })).resolves.toEqual(
      category,
    );
    await expect(controller.update(1, { name: 'Food' })).resolves.toEqual({
      ...category,
      name: 'Food',
    });
    await expect(controller.delete(1)).resolves.toEqual(category);
  });
});
