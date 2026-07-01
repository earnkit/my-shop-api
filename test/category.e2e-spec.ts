import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CategoryController } from '../src/category/category.controller';
import { CategoryService } from '../src/category/category.service';

describe('CategoryController (e2e)', () => {
  let app: INestApplication<App>;
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
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: categoryService,
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

  it('GET /category', async () => {
    categoryService.findAll.mockResolvedValue([category]);

    await request(app.getHttpServer())
      .get('/category')
      .expect(200)
      .expect([category]);

    expect(categoryService.findAll).toHaveBeenCalled();
  });

  it('GET /category/:id', async () => {
    categoryService.getById.mockResolvedValue(category);

    await request(app.getHttpServer())
      .get('/category/1')
      .expect(200)
      .expect(category);

    expect(categoryService.getById).toHaveBeenCalledWith(1);
  });

  it('POST /category', async () => {
    const body = { name: 'Drinks', description: 'Drink products' };
    categoryService.create.mockResolvedValue(category);

    await request(app.getHttpServer())
      .post('/category')
      .send(body)
      .expect(201)
      .expect(category);

    expect(categoryService.create).toHaveBeenCalledWith(body);
  });

  it('PUT /category/:id', async () => {
    const body = { name: 'Food' };
    const updatedCategory = { ...category, ...body };
    categoryService.update.mockResolvedValue(updatedCategory);

    await request(app.getHttpServer())
      .put('/category/1')
      .send(body)
      .expect(200)
      .expect(updatedCategory);

    expect(categoryService.update).toHaveBeenCalledWith(1, body);
  });

  it('DELETE /category/:id', async () => {
    categoryService.delete.mockResolvedValue(category);

    await request(app.getHttpServer())
      .delete('/category/1')
      .expect(200)
      .expect(category);

    expect(categoryService.delete).toHaveBeenCalledWith(1);
  });
});
