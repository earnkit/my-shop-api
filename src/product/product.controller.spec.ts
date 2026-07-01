import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus } from '@prisma/client';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: {
    findAll: jest.Mock;
    getById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
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
    productService = {
      findAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: productService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate product actions to service', async () => {
    productService.findAll.mockResolvedValue([product]);
    productService.getById.mockResolvedValue(product);
    productService.create.mockResolvedValue(product);
    productService.update.mockResolvedValue({ ...product, stock: 5 });
    productService.delete.mockResolvedValue(product);

    await expect(controller.findAll()).resolves.toEqual([product]);
    await expect(controller.getById(1)).resolves.toEqual(product);
    await expect(
      controller.create({ name: 'Coffee', price: 60, categoryId: 1 }),
    ).resolves.toEqual(product);
    await expect(controller.update(1, { stock: 5 })).resolves.toEqual({
      ...product,
      stock: 5,
    });
    await expect(controller.delete(1)).resolves.toEqual(product);
  });
});
