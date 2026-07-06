import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthService } from '../src/auth/auth.service';
import { OrderController } from '../src/order/order.controller';
import { OrderService } from '../src/order/order.service';

describe('OrderController (e2e)', () => {
  let app: INestApplication<App>;
  let orderService: {
    create: jest.Mock;
    createForUser: jest.Mock;
    getOrders: jest.Mock;
    getMyOrders: jest.Mock;
    getOrderDetail: jest.Mock;
    updateStatus: jest.Mock;
  };
  let authService: {
    getProfileFromToken: jest.Mock;
  };

  const order = {
    id: 1,
    userId: 1,
    totalAmount: 120,
    status: OrderStatus.PENDING,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    items: [],
  };

  beforeEach(async () => {
    orderService = {
      create: jest.fn(),
      createForUser: jest.fn(),
      getOrders: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderDetail: jest.fn(),
      updateStatus: jest.fn(),
    };
    authService = {
      getProfileFromToken: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: orderService,
        },
        {
          provide: AuthService,
          useValue: authService,
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

  it('POST /order', async () => {
    const body = { userId: 1, items: [{ productId: 1, quantity: 2 }] };
    orderService.create.mockResolvedValue(order);

    await request(app.getHttpServer())
      .post('/order')
      .send(body)
      .expect(201)
      .expect(order);

    expect(orderService.create).toHaveBeenCalledWith(body);
  });

  it('POST /order/my-orders', async () => {
    const body = { items: [{ productId: 1, quantity: 2 }] };
    const profile = { id: 1, name: 'Earn', email: 'earn@example.com' };
    authService.getProfileFromToken.mockResolvedValue(profile);
    orderService.createForUser.mockResolvedValue(order);

    await request(app.getHttpServer())
      .post('/order/my-orders')
      .set('Authorization', 'Bearer valid-token')
      .send(body)
      .expect(201)
      .expect(order);

    expect(authService.getProfileFromToken).toHaveBeenCalledWith('valid-token');
    expect(orderService.createForUser).toHaveBeenCalledWith(1, body);
  });

  it('GET /order', async () => {
    const result = {
      data: [order],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    orderService.getOrders.mockResolvedValue(result);

    await request(app.getHttpServer())
      .get('/order')
      .query({
        page: 1,
        limit: 10,
        status: OrderStatus.PAID,
        productId: 1,
        userId: 1,
        search: 'earn',
      })
      .expect(200)
      .expect(result);
    expect(orderService.getOrders).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      status: OrderStatus.PAID,
      productId: 1,
      userId: 1,
      search: 'earn',
    });
  });

  it('GET /order/my-orders', async () => {
    const profile = { id: 1, name: 'Earn', email: 'earn@example.com' };
    const result = {
      data: [order],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    authService.getProfileFromToken.mockResolvedValue(profile);
    orderService.getMyOrders.mockResolvedValue(result);

    await request(app.getHttpServer())
      .get('/order/my-orders')
      .query({ page: 1, limit: 10, status: OrderStatus.PAID })
      .set('Authorization', 'Bearer valid-token')
      .expect(200)
      .expect(result);

    expect(authService.getProfileFromToken).toHaveBeenCalledWith('valid-token');
    expect(orderService.getMyOrders).toHaveBeenCalledWith(1, {
      page: 1,
      limit: 10,
      status: OrderStatus.PAID,
    });
  });

  it('GET /order/:id', async () => {
    orderService.getOrderDetail.mockResolvedValue(order);

    await request(app.getHttpServer())
      .get('/order/1')
      .expect(200)
      .expect(order);
    expect(orderService.getOrderDetail).toHaveBeenCalledWith(1);
  });

  it('PATCH /order/:id/status', async () => {
    const body = { status: OrderStatus.PAID };
    const updatedOrder = { ...order, ...body };
    orderService.updateStatus.mockResolvedValue(updatedOrder);

    await request(app.getHttpServer())
      .patch('/order/1/status')
      .send(body)
      .expect(200)
      .expect(updatedOrder);

    expect(orderService.updateStatus).toHaveBeenCalledWith(1, body);
  });
});
