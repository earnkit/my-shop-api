import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: reportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.getSummary with query', async () => {
    const query = { startDate: '2026-01-01', endDate: '2026-01-31' };
    const summary = {
      totalUsers: 1,
      totalCategories: 2,
      totalProducts: 3,
      totalOrders: 4,
      totalSalesAmount: 500,
      lowStockProducts: 1,
    };
    reportsService.getSummary.mockResolvedValue(summary);

    await expect(controller.getSummary(query)).resolves.toEqual(summary);
    expect(reportsService.getSummary).toHaveBeenCalledWith(query);
  });

  it('should call service.getLowStockProducts with query', async () => {
    const query = { threshold: 3, limit: 5 };
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

    await expect(controller.getLowStockProducts(query)).resolves.toEqual(
      products,
    );
    expect(reportsService.getLowStockProducts).toHaveBeenCalledWith(query);
  });

  it('should call service.getOrderStatusSummary with query', async () => {
    const query = { startDate: '2026-01-01' };
    const rows = [{ status: 'PENDING', count: 2 }];
    reportsService.getOrderStatusSummary.mockResolvedValue(rows);

    await expect(controller.getOrderStatusSummary(query)).resolves.toEqual(
      rows,
    );
    expect(reportsService.getOrderStatusSummary).toHaveBeenCalledWith(query);
  });
});
