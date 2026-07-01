import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: { id: 'asc' },
    });
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
