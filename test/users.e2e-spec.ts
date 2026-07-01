import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
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
    password: 'password123',
    tel: '0812345678',
    image: 'https://example.com/avatar.png',
    role: Role.CUSTOMER,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /users', async () => {
    usersService.findAll.mockResolvedValue([user]);

    await request(app.getHttpServer()).get('/users').expect(200).expect([user]);
    expect(usersService.findAll).toHaveBeenCalled();
  });

  it('GET /users/:id', async () => {
    usersService.getById.mockResolvedValue(user);

    await request(app.getHttpServer()).get('/users/1').expect(200).expect(user);
    expect(usersService.getById).toHaveBeenCalledWith(1);
  });

  it('POST /users', async () => {
    const body = {
      name: user.name,
      email: user.email,
      password: user.password,
      tel: user.tel,
      image: user.image,
      role: user.role,
    };
    usersService.create.mockResolvedValue(user);

    await request(app.getHttpServer())
      .post('/users')
      .send(body)
      .expect(201)
      .expect(user);

    expect(usersService.create).toHaveBeenCalledWith(body);
  });

  it('PUT /users/:id', async () => {
    const body = { name: 'New Earn' };
    const updatedUser = { ...user, ...body };
    usersService.update.mockResolvedValue(updatedUser);

    await request(app.getHttpServer())
      .put('/users/1')
      .send(body)
      .expect(200)
      .expect(updatedUser);

    expect(usersService.update).toHaveBeenCalledWith(1, body);
  });

  it('PATCH /users/:id', async () => {
    const body = { tel: '0899999999' };
    const updatedUser = { ...user, ...body };
    usersService.partialUpdate.mockResolvedValue(updatedUser);

    await request(app.getHttpServer())
      .patch('/users/1')
      .send(body)
      .expect(200)
      .expect(updatedUser);

    expect(usersService.partialUpdate).toHaveBeenCalledWith(1, body);
  });

  it('DELETE /users/:id', async () => {
    usersService.delete.mockResolvedValue(user);

    await request(app.getHttpServer())
      .delete('/users/1')
      .expect(200)
      .expect(user);

    expect(usersService.delete).toHaveBeenCalledWith(1);
  });
});
