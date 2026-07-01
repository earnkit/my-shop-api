import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

describe('OrderController', () => {
  let controller: OrderController;
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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: orderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate order actions to service', async () => {
    orderService.create.mockResolvedValue(order);
    orderService.getOrders.mockResolvedValue([order]);
    orderService.getOrderDetail.mockResolvedValue(order);
    orderService.updateStatus.mockResolvedValue({
      ...order,
      status: OrderStatus.PAID,
    });

    await expect(
      controller.create({ userId: 1, items: [{ productId: 1, quantity: 2 }] }),
    ).resolves.toEqual(order);
    await expect(controller.getOrders()).resolves.toEqual([order]);
    await expect(controller.getOrderDetail(1)).resolves.toEqual(order);
    await expect(
      controller.updateStatus(1, { status: OrderStatus.PAID }),
    ).resolves.toEqual({ ...order, status: OrderStatus.PAID });
  });
});
