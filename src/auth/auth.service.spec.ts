import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
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
    tel: null,
    image: null,
    role: Role.CUSTOMER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a user with a hashed password and return an access token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => ({
        ...user,
        ...data,
      }));

      const result = await service.register({
        name: user.name,
        email: user.email,
        password: 'secret',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: user.name,
          email: user.email,
          password: expect.stringMatching(/^scrypt\$/),
        }),
      });
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw ConflictException when email already exists', async () => {
      prisma.user.findFirst.mockResolvedValue(user);

      await expect(
        service.register({
          name: user.name,
          email: user.email,
          password: 'secret',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('should login with a valid legacy plaintext password', async () => {
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      const result = await service.login({
        email: user.email,
        password: 'secret',
      });

      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.user).not.toHaveProperty('password');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { password: expect.stringMatching(/^scrypt\$/) },
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      prisma.user.findFirst.mockResolvedValue(user);

      await expect(
        service.login({
          email: user.email,
          password: 'wrong',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('getProfileFromToken', () => {
    it('should return the user profile from a valid token', async () => {
      prisma.user.findFirst.mockResolvedValue(user);

      const auth = await service.login({
        email: user.email,
        password: 'secret',
      });

      await expect(
        service.getProfileFromToken(auth.accessToken),
      ).resolves.toEqual(
        expect.not.objectContaining({ password: expect.any(String) }),
      );
    });
  });

  describe('updateProfile', () => {
    it('should update the authenticated user profile', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue({
        ...user,
        name: 'New Earn',
        tel: '0899999999',
      });

      await expect(
        service.updateProfile(1, {
          name: 'New Earn',
          tel: '0899999999',
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          id: 1,
          name: 'New Earn',
          tel: '0899999999',
        }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'New Earn',
          tel: '0899999999',
        },
      });
    });

    it('should throw ConflictException when another active user uses the email', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...user, id: 2 });

      await expect(
        service.updateProfile(1, { email: 'earn@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change the password when the current password is valid', async () => {
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      await expect(
        service.changePassword(1, {
          currentPassword: 'secret',
          newPassword: 'newPassword123',
        }),
      ).resolves.toBeUndefined();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: expect.stringMatching(/^scrypt\$/) },
      });
    });

    it('should throw UnauthorizedException when the current password is invalid', async () => {
      prisma.user.findFirst.mockResolvedValue(user);

      await expect(
        service.changePassword(1, {
          currentPassword: 'wrong-password',
          newPassword: 'newPassword123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
