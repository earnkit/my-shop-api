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
    getOrders: jest.Mock;
    exportOrdersCsv: jest.Mock;
    getOrderStatusSummary: jest.Mock;
  };

  beforeEach(async () => {
    reportsService = {
      getSummary: jest.fn(),
      getLowStockProducts: jest.fn(),
      getOrders: jest.fn(),
      exportOrdersCsv: jest.fn(),
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

  it('GET /reports/orders', async () => {
    const report = {
      data: [
        {
          id: 1,
          customerName: 'Earn',
          customerEmail: 'earn@example.com',
          status: 'PAID',
          totalAmount: 1200,
          createdAt: '2026-07-01T04:00:00.000Z',
          items: [
            {
              productId: 3,
              productName: 'Keyboard',
              quantity: 1,
              price: 1200,
              subtotal: 1200,
            },
          ],
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      summary: { totalOrders: 1, totalAmount: 1200 },
    };
    reportsService.getOrders.mockResolvedValue(report);

    await request(app.getHttpServer())
      .get('/reports/orders')
      .query({
        startDate: '2026-07-01',
        endDate: '2026-07-06',
        productId: 3,
        status: 'PAID',
        page: 1,
        limit: 20,
      })
      .expect(200)
      .expect(report);

    expect(reportsService.getOrders).toHaveBeenCalledWith({
      startDate: '2026-07-01',
      endDate: '2026-07-06',
      productId: 3,
      status: 'PAID',
      page: 1,
      limit: 20,
    });
  });

  it('GET /reports/orders allows large limits for CSV export', async () => {
    const report = {
      data: [],
      meta: { page: 1, limit: 250, total: 250, totalPages: 1 },
      summary: { totalOrders: 250, totalAmount: 0 },
    };
    reportsService.getOrders.mockResolvedValue(report);

    await request(app.getHttpServer())
      .get('/reports/orders')
      .query({ page: 1, limit: 250 })
      .expect(200)
      .expect(report);

    expect(reportsService.getOrders).toHaveBeenCalledWith({
      page: 1,
      limit: 250,
    });
  });

  it('GET /reports/orders/export returns csv download', async () => {
    const csv =
      'Order ID,Customer,Email,Status,Created At,Products,Quantities,Total\n1,Earn,earn@example.com,SHIPPED,2026-07-31T04:00:00.000Z,Milk,2,120';
    reportsService.exportOrdersCsv.mockResolvedValue(csv);

    await request(app.getHttpServer())
      .get('/reports/orders/export')
      .query({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        productId: 3,
        status: 'SHIPPED',
      })
      .expect(200)
      .expect('Content-Type', /text\/csv/)
      .expect(
        'Content-Disposition',
        'attachment; filename="order-report-2026-07-31.csv"',
      )
      .expect(csv);

    expect(reportsService.exportOrdersCsv).toHaveBeenCalledWith({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      productId: 3,
      status: 'SHIPPED',
    });
  });
});
