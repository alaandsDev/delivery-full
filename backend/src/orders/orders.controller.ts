import { Body, Controller, Get, Patch, Post, Query, Param } from '@nestjs/common';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const products = await this.prisma.product.findMany({ where: { id: { in: dto.items.map((i) => i.productId) }, storeId: dto.storeId } });

    const itemData = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error('Produto invalido no pedido');
      return {
        productId: product.id,
        quantity: item.quantity,
        name: product.name,
        unitPriceCents: product.priceCents,
      };
    });

    const totalCents = itemData.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

    return this.prisma.order.create({
      data: {
        storeId: dto.storeId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        totalCents,
        items: { create: itemData },
      },
      include: { items: true },
    });
  }

  @Get()
  list(@Query('storeId') storeId: string) {
    return this.prisma.order.findMany({ where: { storeId }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  }

  @Patch(':id/status/:status')
  updateStatus(@Param('id') id: string, @Param('status') status: string) {
    return this.prisma.order.update({ where: { id }, data: { status: status as any } });
  }
}
