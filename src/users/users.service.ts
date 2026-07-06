import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { getPagination, toPaginatedResponse } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const scryptAsync = promisify(scrypt);

type PublicUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UserListQueryDto = {}) {
    const { page, limit, skip } = getPagination(query);
    const search = query.search;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role && { role: query.role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { tel: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return toPaginatedResponse(
      users.map((user) => this.toPublicUser(user)),
      { page, limit },
      total,
    );
  }

  async getById(id: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: this.parseId(id),
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return this.toPublicUser(user);
  }

  async create(body: CreateUserDto) {
    await this.ensureEmailAvailable(body.email);

    const user = await this.createUser(body);

    return this.toPublicUser(user);
  }

  async update(id: number, body: UpdateUserDto) {
    const userId = this.parseId(id);

    await this.getById(userId);

    if (body.email) {
      await this.ensureEmailAvailable(body.email, userId);
    }

    const user = await this.updateUser(userId, body);

    return this.toPublicUser(user);
  }

  async partialUpdate(id: number, body: UpdateUserDto) {
    const userId = this.parseId(id);

    await this.getById(userId);

    if (body.email) {
      await this.ensureEmailAvailable(body.email, userId);
    }

    const user = await this.updateUser(userId, body);

    return this.toPublicUser(user);
  }

  async delete(id: number) {
    await this.getById(id);

    const user = await this.prisma.user.update({
      where: { id: this.parseId(id) },
      data: { deletedAt: new Date() },
    });

    return this.toPublicUser(user);
  }

  private parseId(id: number) {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('User id must be a positive integer');
    }

    return id;
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scryptAsync(password, salt, 64)) as Buffer;

    return `scrypt$${salt}$${hash.toString('hex')}`;
  }

  private async withHashedPassword<T extends UpdateUserDto>(body: T) {
    if (!body.password) {
      return body;
    }

    return {
      ...body,
      password: await this.hashPassword(body.password),
    };
  }

  private async createUser(body: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          ...body,
          password: await this.hashPassword(body.password),
        },
      });
    } catch (error) {
      if (this.isUniqueEmailError(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  private async updateUser(id: number, body: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: await this.withHashedPassword(body),
      });
    } catch (error) {
      if (this.isUniqueEmailError(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  private async ensureEmailAvailable(email: string, excludeId?: number) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }
  }

  private isUniqueEmailError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const prismaError = error as {
      code?: unknown;
      meta?: { target?: unknown; constraint?: unknown };
      cause?: { constraint?: { fields?: unknown } };
    };
    const target = prismaError.meta?.target;
    const constraint = prismaError.meta?.constraint;
    const fields = prismaError.cause?.constraint?.fields;

    return (
      prismaError.code === 'P2002' &&
      ((Array.isArray(target) && target.includes('email')) ||
        (typeof constraint === 'string' && constraint.includes('email')) ||
        (Array.isArray(fields) && fields.includes('email')))
    );
  }

  private toPublicUser(user: User): PublicUser {
    return {
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
  }
}
