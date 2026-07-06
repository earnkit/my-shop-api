import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  profile(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update authenticated user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(request.user.id, body);
  }

  @Patch('change-password')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change authenticated user password' })
  @ApiNoContentResponse({ description: 'Password changed successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: ChangePasswordDto,
  ) {
    return this.authService.changePassword(request.user.id, body);
  }
}
