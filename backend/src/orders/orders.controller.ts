import { Body, Controller, Get, Patch, Post, Query, Param, ForbiddenException } from '@nestjs/common';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';
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
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto) items!: CreateOrderItemDto[];
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  // Público — cliente faz pedido sem conta
  @Public()
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i: CreateOrderItemDto) => i.productId) }, storeId: dto.storeId },
    });

    const itemData = dto.items.map((item) => {
      const product = products.find((p: { id: string }) => p.id === item.productId);
      if (!product) throw new Error('Produto inválido no pedido');
      return { productId: product.id, quantity: item.quantity, name: product.name, unitPriceCents: product.priceCents };
    });

    const totalCents = itemData.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

    const order = await this.prisma.order.create({
      data: { storeId: dto.storeId, customerName: dto.customerName, customerPhone: dto.customerPhone, totalCents, items: { create: itemData } },
      include: { items: true },
    });

    // Emitir evento WebSocket para a loja
    this.events.notifyStore(dto.storeId, 'new_order', order);

    return order;
  }

  @Get()
  async list(@Query('storeId') storeId: string, @CurrentUser() user: JwtPayload) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.ownerId !== user.id) throw new ForbiddenException();
    return this.prisma.order.findMany({ where: { storeId }, include: { items: true }, orderBy: { createdAt: 'desc' } });
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
