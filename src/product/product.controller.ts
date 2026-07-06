import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('Product')
@Controller(['product', 'products'])
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Find all products' })
  findAll(@Query() query: ProductListQueryDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a product by ID' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() body: CreateProductDto) {
    return this.productService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product by ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ) {
    return this.productService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product by ID' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.productService.delete(id);
  }
}
