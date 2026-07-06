import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination, toPaginatedResponse } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductListQueryDto = {}) {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException(
        'minPrice must not be greater than maxPrice',
      );
    }

    const { page, limit, skip } = getPagination(query);
    const search = query.search;
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.status && { status: query.status }),
      ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
        price: {
          ...(query.minPrice !== undefined && { gte: query.minPrice }),
          ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
        },
      }),
      ...(query.lowStock && { stock: { lte: 5 } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return toPaginatedResponse(products, { page, limit }, total);
  }

  async getById(id: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: this.parseId(id),
        deletedAt: null,
      },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async create(body: CreateProductDto) {
    await this.ensureCategoryExists(body.categoryId);

    return this.prisma.product.create({
      data: body,
      include: { category: true },
    });
  }

  async update(id: number, body: UpdateProductDto) {
    await this.getById(id);

    if (body.categoryId) {
      await this.ensureCategoryExists(body.categoryId);
    }

    return this.prisma.product.update({
      where: { id: this.parseId(id) },
      data: body,
      include: { category: true },
    });
  }

  async delete(id: number) {
    await this.getById(id);

    return this.prisma.product.update({
      where: { id: this.parseId(id) },
      data: { deletedAt: new Date() },
      include: { category: true },
    });
  }

  private async ensureCategoryExists(categoryId: number) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${categoryId} not found`);
    }
  }

  private parseId(id: number) {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('Product id must be a positive integer');
    }

    return id;
  }
}
