import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findAll: jest.Mock;
    getById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    partialUpdate: jest.Mock;
    delete: jest.Mock;
  };

  const user = {
    id: 1,
    name: 'Earn',
    email: 'earn@example.com',
    password: 'secret',
    tel: '0812345678',
    image: 'https://example.com/avatar.png',
    role: Role.CUSTOMER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  const createUserDto: CreateUserDto = {
    name: user.name,
    email: user.email,
    password: user.password,
    tel: user.tel,
    image: user.image,
    role: user.role,
  };

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      partialUpdate: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find all users', async () => {
    usersService.findAll.mockResolvedValue([user]);

    await expect(controller.findAll()).resolves.toEqual([user]);
    expect(usersService.findAll).toHaveBeenCalled();
  });

  it('should get a user by id', async () => {
    usersService.getById.mockResolvedValue(user);

    await expect(controller.getById(1)).resolves.toEqual(user);
    expect(usersService.getById).toHaveBeenCalledWith(1);
  });

  it('should create a user', async () => {
    usersService.create.mockResolvedValue(user);

    await expect(controller.create(createUserDto)).resolves.toEqual(user);
    expect(usersService.create).toHaveBeenCalledWith(createUserDto);
  });

  it('should update a user', async () => {
    usersService.update.mockResolvedValue({ ...user, name: 'New Earn' });

    await expect(
      controller.update(1, { ...createUserDto, name: 'New Earn' }),
    ).resolves.toEqual({ ...user, name: 'New Earn' });
    expect(usersService.update).toHaveBeenCalledWith(1, {
      ...createUserDto,
      name: 'New Earn',
    });
  });

  it('should partially update a user', async () => {
    usersService.partialUpdate.mockResolvedValue({
      ...user,
      tel: '0899999999',
    });

    await expect(
      controller.partialUpdate(1, { tel: '0899999999' }),
    ).resolves.toEqual({ ...user, tel: '0899999999' });
    expect(usersService.partialUpdate).toHaveBeenCalledWith(1, {
      tel: '0899999999',
    });
  });

  it('should delete a user', async () => {
    usersService.delete.mockResolvedValue(user);

    await expect(controller.delete(1)).resolves.toEqual(user);
    expect(usersService.delete).toHaveBeenCalledWith(1);
  });
});
