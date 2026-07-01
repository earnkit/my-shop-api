import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { OrderController } from '../src/order/order.controller';
import { OrderService } from '../src/order/order.service';

describe('OrderController (e2e)', () => {
  let app: INestApplication<App>;
  let orderService: {
    create: jest.Mock;
    getOrders: jest.Mock;
    getOrderDetail: jest.Mock;
    updateStatus: jest.Mock;
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
      getOrders: jest.fn(),
      getOrderDetail: jest.fn(),
      updateStatus: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: orderService,
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

  it('GET /order', async () => {
    orderService.getOrders.mockResolvedValue([order]);

    await request(app.getHttpServer())
      .get('/order')
      .expect(200)
      .expect([order]);
    expect(orderService.getOrders).toHaveBeenCalled();
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
