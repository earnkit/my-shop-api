import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

jest.mock('@prisma/client', () => ({
  PrismaClient: class {
    $connect = jest.fn();
    $disconnect = jest.fn();
  },
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn(),
}));

describe('PrismaService', () => {
  let service: PrismaService;
  const databaseUrl = process.env.DATABASE_URL;

  beforeEach(async () => {
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(() => {
    if (databaseUrl) {
      process.env.DATABASE_URL = databaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  });
});
