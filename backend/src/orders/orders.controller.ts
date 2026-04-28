import { Body, Controller, Get, Patch, Post, Query, Param, ForbiddenException } from '@nestjs/common';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/guards/jwt.guard';
import { EventsGateway } from '../events/events.gateway';

class CreateOrderItemDto {
  @IsString() productId!: string;
  @IsInt() @Min(1) quantity!: number;
}

class CreateOrderDto {
  @IsString() storeId!: string;
  @IsString() customerName!: string;
  @IsString() customerPhone!: string;
  @IsOptional() @IsString() customerAddress?: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() couponCode?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto) items!: CreateOrderItemDto[];
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  @Public()
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i: CreateOrderItemDto) => i.productId) }, storeId: dto.storeId },
    });

    const itemData = dto.items.map((item: CreateOrderItemDto) => {
      const product = products.find((p: { id: string }) => p.id === item.productId);
      if (!product) throw new Error('Produto inválido no pedido');
      return { productId: product.id, quantity: item.quantity, name: product.name, unitPriceCents: product.priceCents };
    });

    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    const deliveryFeeCents = store?.deliveryFee ?? 0;
    const subtotalCents = itemData.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

    // Validar e aplicar cupom
    let discountCents = 0;
    let couponCode: string | undefined;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { storeId_code: { storeId: dto.storeId, code: dto.couponCode.toUpperCase() } },
      });
      if (coupon && coupon.active && (!coupon.maxUses || coupon.usedCount < coupon.maxUses)) {
        discountCents = coupon.discountType === 'percent'
          ? Math.floor((subtotalCents * coupon.discountValue) / 100)
          : coupon.discountValue;
        discountCents = Math.min(discountCents, subtotalCents);
        couponCode = coupon.code;
        await this.prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }
    }

    const totalCents = subtotalCents + deliveryFeeCents - discountCents;

    // Upsert cliente
    const phone = dto.customerPhone.replace(/\D/g, '');
    const customer = await this.prisma.customer.upsert({
      where: { storeId_phone: { storeId: dto.storeId, phone } },
      update: { name: dto.customerName, address: dto.customerAddress ?? undefined },
      create: { storeId: dto.storeId, phone, name: dto.customerName, address: dto.customerAddress },
    });

    const order = await this.prisma.order.create({
      data: {
        storeId: dto.storeId,
        customerId: customer.id,
        customerName: dto.customerName,
        customerPhone: phone,
        customerAddress: dto.customerAddress,
        paymentMethod: dto.paymentMethod ?? 'pix',
        deliveryFeeCents,
        discountCents,
        couponCode,
        totalCents,
        items: { create: itemData },
      },
      include: { items: true },
    });

    this.events.notifyStore(dto.storeId, 'new_order', order);
    return order;
  }

  @Get()
  async list(@Query('storeId') storeId: string, @CurrentUser() user: JwtPayload) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.ownerId !== user.id) throw new ForbiddenException();
    return this.prisma.order.findMany({
      where: { storeId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id/status/:status')
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { store: true } });
    if (!order || order.store.ownerId !== user.id) throw new ForbiddenException();
    const updated = await this.prisma.order.update({ where: { id }, data: { status: status as any } });
    this.events.notifyStore(order.storeId, 'order_updated', updated);
    return updated;
  }
}
