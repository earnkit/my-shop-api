import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination, toPaginatedResponse } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryListQueryDto } from './dto/category-list-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CategoryListQueryDto = {}) {
    const { page, limit, skip } = getPagination(query);
    const search = query.search;
    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    return toPaginatedResponse(categories, { page, limit }, total);
  }

  async getById(id: number) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: this.parseId(id),
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  async create(body: CreateCategoryDto) {
    await this.ensureNameAvailable(body.name);

    try {
      return await this.prisma.category.create({
        data: body,
      });
    } catch (error) {
      if (this.isUniqueNameError(error)) {
        throw new ConflictException('Category name already exists');
      }

      throw error;
    }
  }

  async update(id: number, body: UpdateCategoryDto) {
    const categoryId = this.parseId(id);

    await this.getById(categoryId);

    if (body.name) {
      await this.ensureNameAvailable(body.name, categoryId);
    }

    try {
      return await this.prisma.category.update({
        where: { id: categoryId },
        data: body,
      });
    } catch (error) {
      if (this.isUniqueNameError(error)) {
        throw new ConflictException('Category name already exists');
      }

      throw error;
    }
  }

  async delete(id: number) {
    await this.getById(id);

    return this.prisma.category.update({
      where: { id: this.parseId(id) },
      data: { deletedAt: new Date() },
    });
  }

  private parseId(id: number) {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('Category id must be a positive integer');
    }

    return id;
  }

  private async ensureNameAvailable(name: string, excludeId?: number) {
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    if (existingCategory) {
      throw new ConflictException('Category name already exists');
    }
  }

  private isUniqueNameError(error: unknown) {
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
      ((Array.isArray(target) && target.includes('name')) ||
        (typeof constraint === 'string' && constraint.includes('name')) ||
        (Array.isArray(fields) && fields.includes('name')))
    );
  }
}
