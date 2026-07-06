import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import {
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const scryptAsync = promisify(scrypt);

type JwtPayload = {
  sub: number;
  email: string;
  role: Role;
  exp: number;
};

export type PublicUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(body: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: body.email, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    let user: User;

    try {
      user = await this.prisma.user.create({
        data: {
          ...body,
          password: await this.hashPassword(body.password),
          role: Role.CUSTOMER,
        },
      });
    } catch (error) {
      if (this.isUniqueEmailError(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }

    return this.buildAuthResponse(user);
  }

  async login(body: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: body.email, deletedAt: null },
    });

    if (!user || !(await this.verifyPassword(body.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!this.isScryptHash(user.password)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: await this.hashPassword(body.password) },
      });
    }

    return this.buildAuthResponse(user);
  }

  async getProfileFromToken(token: string) {
    const payload = this.verifyToken(token);
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.toPublicUser(user);
  }

  async updateProfile(userId: number, body: UpdateProfileDto) {
    if (body.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: body.email,
          deletedAt: null,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email is already registered');
      }
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: body,
      });

      return this.toPublicUser(user);
    } catch (error) {
      if (this.isUniqueEmailError(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  async changePassword(userId: number, body: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (
      !user ||
      !(await this.verifyPassword(body.currentPassword, user.password))
    ) {
      throw new UnauthorizedException('Invalid current password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await this.hashPassword(body.newPassword) },
    });
  }

  private buildAuthResponse(user: User) {
    return {
      accessToken: this.signToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      tel: user.tel,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scryptAsync(password, salt, 64)) as Buffer;

    return `scrypt$${salt}$${hash.toString('hex')}`;
  }

  private async verifyPassword(password: string, passwordHash: string) {
    if (!this.isScryptHash(passwordHash)) {
      return password === passwordHash;
    }

    const [, salt, storedHash] = passwordHash.split('$');
    const hash = (await scryptAsync(password, salt, 64)) as Buffer;
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    return (
      hash.length === storedHashBuffer.length &&
      timingSafeEqual(hash, storedHashBuffer)
    );
  }

  private isScryptHash(passwordHash: string) {
    return passwordHash.startsWith('scrypt$');
  }

  private isUniqueEmailError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const prismaError = error as {
      code?: unknown;
      meta?: { target?: unknown; constraint?: unknown };
      cause?: { constraint?: { fields?: unknown } };
    };
    const target = prismaError.meta?.target;
    const constraint = prismaError.meta?.constraint;
    const fields = prismaError.cause?.constraint?.fields;

    return (
      prismaError.code === 'P2002' &&
      ((Array.isArray(target) && target.includes('email')) ||
        (typeof constraint === 'string' && constraint.includes('email')) ||
        (Array.isArray(fields) && fields.includes('email')))
    );
  }

  private signToken(payload: Omit<JwtPayload, 'exp'>) {
    const tokenPayload: JwtPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + this.jwtExpiresInSeconds(),
    };
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));
    const signature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verifyToken(token: string) {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const expectedSignature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
    );

    if (!this.safeCompare(signature, expectedSignature)) {
      throw new UnauthorizedException('Invalid token');
    }

    let payload: JwtPayload;

    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Invalid token');
    }

    return payload;
  }

  private createSignature(value: string) {
    return createHmac('sha256', this.jwtSecret())
      .update(value)
      .digest('base64url');
  }

  private safeCompare(value: string, expectedValue: string) {
    const valueHash = createHash('sha256').update(value).digest();
    const expectedValueHash = createHash('sha256')
      .update(expectedValue)
      .digest();

    return timingSafeEqual(valueHash, expectedValueHash);
  }

  private base64UrlEncode(value: string) {
    return Buffer.from(value).toString('base64url');
  }

  private jwtSecret() {
    return process.env.JWT_SECRET ?? 'dev-only-secret';
  }

  private jwtExpiresInSeconds() {
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '1d';
    const match = expiresIn.match(/^(\d+)([smhd])?$/);

    if (!match) {
      return 60 * 60 * 24;
    }

    const value = Number(match[1]);
    const unit = match[2] ?? 's';
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 60 * 60 * 24,
    };

    return value * multipliers[unit];
  }
}
