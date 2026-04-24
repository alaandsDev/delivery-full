import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { compareSync, hashSync } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(input: { name: string; email: string; password: string }) {
    const exists = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new UnauthorizedException('Email ja cadastrado');

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: hashSync(input.password, 10),
        role: 'MERCHANT',
      },
    });

    return this.issueTokens({ id: user.id, email: user.email, role: user.role });
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !compareSync(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Credenciais invalidas');
    }
    return this.issueTokens({ id: user.id, email: user.email, role: user.role });
  }

  private issueTokens(payload: { id: string; email: string; role: string }) {
    const accessSecret = (this.config.get<string>('JWT_SECRET') ?? 'dev-secret') as string;
    const refreshSecret = (this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret') as string;
    const accessToken = sign(payload, accessSecret, {
      expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m') as any,
    });
    const refreshToken = sign(payload, refreshSecret, {
      expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d') as any,
    });

    return { accessToken, refreshToken, user: payload };
  }
}
