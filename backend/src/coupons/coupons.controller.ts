import { Body, Controller, Get, Post, Patch, Param, Query, ForbiddenException, BadRequestException } from '@nestjs/common';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/guards/jwt.guard';

class CreateCouponDto {
  @IsString() storeId!: string;
  @IsString() code!: string;
  @IsString() discountType!: string; // percent | fixed
  @IsInt() @Min(1) discountValue!: number;
  @IsOptional() @IsInt() @Min(0) minOrderCents?: number;
  @IsOptional() @IsInt() @Min(1) maxUses?: number;
  @IsOptional() @IsDateString() expiresAt?: string;
}

@Controller('coupons')
export class CouponsController {
  constructor(private readonly prisma: PrismaService) {}

  // Público — cliente valida cupom no checkout
  @Public()
  @Get('validate')
  async validate(
    @Query('storeId') storeId: string,
    @Query('code') code: string,
    @Query('orderCents') orderCents: string,
  ) {
    if (!storeId || !code) throw new BadRequestException('storeId e code são obrigatórios');

    const coupon = await this.prisma.coupon.findUnique({
      where: { storeId_code: { storeId, code: code.toUpperCase() } },
    });

    if (!coupon || !coupon.active) throw new BadRequestException('Cupom inválido ou inativo');
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new BadRequestException('Cupom expirado');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Cupom esgotado');

    const cents = parseInt(orderCents ?? '0', 10);
    if (cents < coupon.minOrderCents) {
      throw new BadRequestException(
        `Pedido mínimo de R$ ${(coupon.minOrderCents / 100).toFixed(2).replace('.', ',')} para este cupom`,
      );
    }

    const discount =
      coupon.discountType === 'percent'
        ? Math.floor((cents * coupon.discountValue) / 100)
        : coupon.discountValue;

    return { valid: true, coupon, discountCents: Math.min(discount, cents) };
  }

  // Autenticado — lojista gerencia cupons
  @Get()
  async list(@Query('storeId') storeId: string, @CurrentUser() user: JwtPayload) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.ownerId !== user.id) throw new ForbiddenException();
    return this.prisma.coupon.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } });
  }

  @Post()
  async create(@Body() dto: CreateCouponDto, @CurrentUser() user: JwtPayload) {
    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    if (!store || store.ownerId !== user.id) throw new ForbiddenException();
    return this.prisma.coupon.create({
      data: { ...dto, code: dto.code.toUpperCase(), expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined },
    });
  }

  @Patch(':id/toggle')
  async toggle(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id }, include: { store: true } });
    if (!coupon || coupon.store.ownerId !== user.id) throw new ForbiddenException();
    return this.prisma.coupon.update({ where: { id }, data: { active: !coupon.active } });
  }
}
