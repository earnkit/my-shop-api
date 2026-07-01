import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const user = {
    id: 1,
    name: 'Earn',
    email: 'earn@example.com',
    password: 'secret',
    tel: '0812345678',
    image: 'https://example.com/avatar.png',
    role: Role.CUSTOMER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  const createUserDto: CreateUserDto = {
    name: user.name,
    email: user.email,
    password: 'password123',
    tel: user.tel,
    image: user.image,
    role: user.role,
  };
  const publicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    tel: user.tel,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all non-deleted users', async () => {
      prisma.user.findMany.mockResolvedValue([user]);

      await expect(service.findAll()).resolves.toEqual([publicUser]);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { id: 'asc' },
      });
    });
  });

  describe('getById', () => {
    it('should return a non-deleted user by id', async () => {
      prisma.user.findFirst.mockResolvedValue(user);

      await expect(service.getById(1)).resolves.toEqual(publicUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.getById(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when id is invalid', async () => {
      await expect(service.getById(0)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a user with a hashed password', async () => {
      prisma.user.create.mockResolvedValue(user);

      await expect(service.create(createUserDto)).resolves.toEqual(publicUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createUserDto,
          password: expect.stringMatching(/^scrypt\$/),
        }),
      });
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({ ...user, name: 'New Earn' });

      await expect(
        service.update(1, { ...createUserDto, name: 'New Earn' }),
      ).resolves.toEqual({ ...publicUser, name: 'New Earn' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          ...createUserDto,
          name: 'New Earn',
          password: expect.stringMatching(/^scrypt\$/),
        }),
      });
    });
  });

  describe('partialUpdate', () => {
    it('should partially update an existing user', async () => {
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({ ...user, tel: '0899999999' });

      await expect(
        service.partialUpdate(1, { tel: '0899999999' }),
      ).resolves.toEqual({ ...publicUser, tel: '0899999999' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { tel: '0899999999' },
      });
    });
  });

  describe('delete', () => {
    it('should soft delete an existing user', async () => {
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({
        ...user,
        deletedAt: expect.any(Date),
      });

      await service.delete(1);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
