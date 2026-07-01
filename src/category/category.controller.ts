import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Find all categories' })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a category by ID' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  create(@Body() body: CreateCategoryDto) {
    return this.categoryService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category by ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category by ID' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.delete(id);
  }
}
