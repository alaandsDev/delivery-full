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

  async register(input: { name: string; email: string; password: string; phone?: string }) {
    const exists = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new UnauthorizedException('Email ja cadastrado');

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: hashSync(input.password, 10),
        role: 'MERCHANT',
        trialStartsAt: now,
        trialEndsAt,
      },
    });

    return this.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
    });
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !compareSync(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Credenciais invalidas');
    }
    if (user.role === 'MERCHANT' && user.trialEndsAt && user.trialEndsAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Seu periodo de teste de 3 dias expirou');
    }
    return this.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
    });
  }

  private issueTokens(payload: { id: string; email: string; role: string; trialEndsAt: string | null }) {
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
