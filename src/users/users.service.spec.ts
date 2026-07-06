import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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
      count: jest.Mock;
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
        count: jest.fn(),
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
      prisma.user.count.mockResolvedValue(1);

      await expect(service.findAll()).resolves.toEqual({
        data: [publicUser],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });

    it('should filter users by search and role', async () => {
      prisma.user.findMany.mockResolvedValue([user]);
      prisma.user.count.mockResolvedValue(1);

      await service.findAll({
        search: 'earn',
        role: Role.CUSTOMER,
        page: 2,
        limit: 5,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          role: Role.CUSTOMER,
          OR: [
            { name: { contains: 'earn', mode: 'insensitive' } },
            { email: { contains: 'earn', mode: 'insensitive' } },
            { tel: { contains: 'earn', mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
        skip: 5,
        take: 5,
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
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(user);

      await expect(service.create(createUserDto)).resolves.toEqual(publicUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: createUserDto.email, deletedAt: null },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createUserDto,
          password: expect.stringMatching(/^scrypt\$/),
        }),
      });
    });

    it('should throw ConflictException when a non-deleted user has the same email', async () => {
      prisma.user.findFirst.mockResolvedValue(user);

      await expect(service.create(createUserDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: createUserDto.email, deletedAt: null },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the database rejects a duplicate email', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      });

      await expect(service.create(createUserDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);
      prisma.user.update.mockResolvedValue({ ...user, name: 'New Earn' });

      await expect(
        service.update(1, { ...createUserDto, name: 'New Earn' }),
      ).resolves.toEqual({ ...publicUser, name: 'New Earn' });
      expect(prisma.user.findFirst).toHaveBeenLastCalledWith({
        where: { email: createUserDto.email, deletedAt: null, NOT: { id: 1 } },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          ...createUserDto,
          name: 'New Earn',
          password: expect.stringMatching(/^scrypt\$/),
        }),
      });
    });

    it('should throw ConflictException when updating to another active user email', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ ...user, id: 2 });

      await expect(
        service.update(1, { ...createUserDto, email: 'other@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
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

    it('should throw ConflictException when partially updating to another active user email', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ ...user, id: 2 });

      await expect(
        service.partialUpdate(1, { email: 'other@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
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
