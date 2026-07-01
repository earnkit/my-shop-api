import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a user', () => {
    const body = {
      name: 'Earn',
      email: 'earn@example.com',
      password: 'secret',
    };
    authService.register.mockReturnValue({ accessToken: 'token' });

    expect(controller.register(body)).toEqual({ accessToken: 'token' });
    expect(authService.register).toHaveBeenCalledWith(body);
  });

  it('should login a user', () => {
    const body = {
      email: 'earn@example.com',
      password: 'secret',
    };
    authService.login.mockReturnValue({ accessToken: 'token' });

    expect(controller.login(body)).toEqual({ accessToken: 'token' });
    expect(authService.login).toHaveBeenCalledWith(body);
  });
});
