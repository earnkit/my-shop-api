import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    updateProfile: jest.Mock;
    changePassword: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
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

  it('should update the authenticated user profile', () => {
    const request = {
      user: { id: 1 },
    };
    const body = {
      name: 'New Earn',
      tel: '0899999999',
    };
    const profile = {
      id: 1,
      name: 'New Earn',
      email: 'earn@example.com',
      tel: '0899999999',
    };
    authService.updateProfile.mockReturnValue(profile);

    expect(controller.updateProfile(request as never, body)).toEqual(profile);
    expect(authService.updateProfile).toHaveBeenCalledWith(1, body);
  });

  it('should change the authenticated user password', () => {
    const request = {
      user: { id: 1 },
    };
    const body = {
      currentPassword: 'password123',
      newPassword: 'newPassword123',
    };

    authService.changePassword.mockReturnValue(undefined);

    expect(controller.changePassword(request as never, body)).toBeUndefined();
    expect(authService.changePassword).toHaveBeenCalledWith(1, body);
  });
});
