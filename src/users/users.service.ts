import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const scryptAsync = promisify(scrypt);

type PublicUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
    });

    return users.map((user) => this.toPublicUser(user));
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
    const user = await this.prisma.user.create({
      data: {
        ...body,
        password: await this.hashPassword(body.password),
      },
    });

    return this.toPublicUser(user);
  }

  async update(id: number, body: UpdateUserDto) {
    await this.getById(id);

    const user = await this.prisma.user.update({
      where: { id: this.parseId(id) },
      data: await this.withHashedPassword(body),
    });

    return this.toPublicUser(user);
  }

  async partialUpdate(id: number, body: UpdateUserDto) {
    await this.getById(id);

    const user = await this.prisma.user.update({
      where: { id: this.parseId(id) },
      data: await this.withHashedPassword(body),
    });

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
