import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ReportsController } from '../src/reports/reports.controller';
import { ReportsService } from '../src/reports/reports.service';

describe('ReportsController (e2e)', () => {
  let app: INestApplication<App>;
  let reportsService: {
    getSummary: jest.Mock;
    getLowStockProducts: jest.Mock;
    getOrderStatusSummary: jest.Mock;
  };

  beforeEach(async () => {
    reportsService = {
      getSummary: jest.fn(),
      getLowStockProducts: jest.fn(),
      getOrderStatusSummary: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: reportsService,
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

  it('GET /reports/summary', async () => {
    const summary = {
      totalUsers: 1,
      totalCategories: 2,
      totalProducts: 3,
      totalOrders: 4,
      totalSalesAmount: 500,
      lowStockProducts: 1,
    };
    reportsService.getSummary.mockResolvedValue(summary);

    await request(app.getHttpServer())
      .get('/reports/summary')
      .query({ startDate: '2026-01-01', endDate: '2026-01-31' })
      .expect(200)
      .expect(summary);

    expect(reportsService.getSummary).toHaveBeenCalledWith({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
  });

  it('GET /reports/low-stock-products', async () => {
    const products = [
      {
        id: 1,
        name: 'Keyboard',
        price: 1200,
        stock: 2,
        status: 'ACTIVE',
        category: { id: 1, name: 'Accessories' },
      },
    ];
    reportsService.getLowStockProducts.mockResolvedValue(products);

    await request(app.getHttpServer())
      .get('/reports/low-stock-products')
      .query({ threshold: 3, limit: 5 })
      .expect(200)
      .expect(products);

    expect(reportsService.getLowStockProducts).toHaveBeenCalledWith({
      threshold: 3,
      limit: 5,
    });
  });

  it('GET /reports/order-status-summary', async () => {
    const rows = [{ status: 'PENDING', count: 2 }];
    reportsService.getOrderStatusSummary.mockResolvedValue(rows);

    await request(app.getHttpServer())
      .get('/reports/order-status-summary')
      .query({ startDate: '2026-01-01' })
      .expect(200)
      .expect(rows);

    expect(reportsService.getOrderStatusSummary).toHaveBeenCalledWith({
      startDate: '2026-01-01',
    });
  });
});
