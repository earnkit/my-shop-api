import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    getProfileFromToken: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      getProfileFromToken: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
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

  it('POST /auth/register', async () => {
    const body = {
      name: 'Earn',
      email: 'earn@example.com',
      password: 'password123',
    };
    const responseBody = { accessToken: 'register-token' };
    authService.register.mockResolvedValue(responseBody);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(body)
      .expect(201)
      .expect(responseBody);

    expect(authService.register).toHaveBeenCalledWith(body);
  });

  it('POST /auth/login', async () => {
    const body = {
      email: 'earn@example.com',
      password: 'password123',
    };
    const responseBody = { accessToken: 'login-token' };
    authService.login.mockResolvedValue(responseBody);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send(body)
      .expect(201)
      .expect(responseBody);

    expect(authService.login).toHaveBeenCalledWith(body);
  });

  it('GET /auth/profile', async () => {
    const profile = {
      id: 1,
      name: 'Earn',
      email: 'earn@example.com',
      role: 'CUSTOMER',
    };
    authService.getProfileFromToken.mockResolvedValue(profile);

    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', 'Bearer valid-token')
      .expect(200)
      .expect(profile);

    expect(authService.getProfileFromToken).toHaveBeenCalledWith('valid-token');
  });

  it('GET /auth/profile returns 401 without bearer token', async () => {
    await request(app.getHttpServer()).get('/auth/profile').expect(401);
    expect(authService.getProfileFromToken).not.toHaveBeenCalled();
  });
});
