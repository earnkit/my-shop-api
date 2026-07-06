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
    updateProfile: jest.Mock;
    changePassword: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      getProfileFromToken: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
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

  it('PATCH /auth/profile', async () => {
    const profile = {
      id: 1,
      name: 'Earn',
      email: 'earn@example.com',
      role: 'CUSTOMER',
    };
    const body = {
      name: 'New Earn',
      tel: '0899999999',
    };
    const updatedProfile = {
      ...profile,
      ...body,
    };
    authService.getProfileFromToken.mockResolvedValue(profile);
    authService.updateProfile.mockResolvedValue(updatedProfile);

    await request(app.getHttpServer())
      .patch('/auth/profile')
      .set('Authorization', 'Bearer valid-token')
      .send(body)
      .expect(200)
      .expect(updatedProfile);

    expect(authService.getProfileFromToken).toHaveBeenCalledWith('valid-token');
    expect(authService.updateProfile).toHaveBeenCalledWith(1, body);
  });

  it('PATCH /auth/change-password', async () => {
    const profile = {
      id: 1,
      name: 'Earn',
      email: 'earn@example.com',
      role: 'CUSTOMER',
    };
    const body = {
      currentPassword: 'password123',
      newPassword: 'newPassword123',
    };
    authService.getProfileFromToken.mockResolvedValue(profile);
    authService.changePassword.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .patch('/auth/change-password')
      .set('Authorization', 'Bearer valid-token')
      .send(body)
      .expect(204)
      .expect('');

    expect(authService.getProfileFromToken).toHaveBeenCalledWith('valid-token');
    expect(authService.changePassword).toHaveBeenCalledWith(1, body);
  });
});
