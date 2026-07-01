import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
    });
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

  create(body: CreateCategoryDto) {
    return this.prisma.category.create({
      data: body,
    });
  }

  async update(id: number, body: UpdateCategoryDto) {
    await this.getById(id);

    return this.prisma.category.update({
      where: { id: this.parseId(id) },
      data: body,
    });
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
}
