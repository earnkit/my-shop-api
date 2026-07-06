import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Put,
  Delete,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserListQueryDto } from './dto/user-list-query.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Find all users' })
  findAll(@Query() query: UserListQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a user by ID' })
  @ApiOkResponse({ type: UserResponseDto })
  getById(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(@Body() body: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiOkResponse({ type: UserResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a user by ID' })
  @ApiOkResponse({ type: UserResponseDto })
  partialUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.partialUpdate(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiOkResponse({ type: UserResponseDto })
  delete(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.delete(id);
  }
}
