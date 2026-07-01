import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { ProductController } from '../src/product/product.controller';
import { ProductService } from '../src/product/product.service';

describe('ProductController (e2e)', () => {
  let app: INestApplication<App>;
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
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: productService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /product', async () => {
    productService.findAll.mockResolvedValue([product]);

    await request(app.getHttpServer())
      .get('/product')
      .expect(200)
      .expect([product]);

    expect(productService.findAll).toHaveBeenCalled();
  });

  it('GET /product/:id', async () => {
    productService.getById.mockResolvedValue(product);

    await request(app.getHttpServer())
      .get('/product/1')
      .expect(200)
      .expect(product);

    expect(productService.getById).toHaveBeenCalledWith(1);
  });

  it('POST /product', async () => {
    const body = {
      name: 'Coffee',
      description: 'Hot coffee',
      price: 60,
      stock: 10,
      status: ProductStatus.ACTIVE,
      categoryId: 1,
    };
    productService.create.mockResolvedValue(product);

    await request(app.getHttpServer())
      .post('/product')
      .send(body)
      .expect(201)
      .expect(product);

    expect(productService.create).toHaveBeenCalledWith(body);
  });

  it('PUT /product/:id', async () => {
    const body = { stock: 5 };
    const updatedProduct = { ...product, ...body };
    productService.update.mockResolvedValue(updatedProduct);

    await request(app.getHttpServer())
      .put('/product/1')
      .send(body)
      .expect(200)
      .expect(updatedProduct);

    expect(productService.update).toHaveBeenCalledWith(1, body);
  });

  it('DELETE /product/:id', async () => {
    productService.delete.mockResolvedValue(product);

    await request(app.getHttpServer())
      .delete('/product/1')
      .expect(200)
      .expect(product);

    expect(productService.delete).toHaveBeenCalledWith(1);
  });
});
