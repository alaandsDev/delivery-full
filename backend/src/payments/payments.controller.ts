import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

class CreatePaymentDto {
  @IsString() orderId!: string;
  @IsString() provider!: string;
  @IsString() status!: string;
  @IsInt() amountCents!: number;
  @IsOptional() @IsString() externalId?: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.prisma.payment.create({ data: dto as any });
  }

  @Get()
  list(@Query('orderId') orderId?: string) {
    return this.prisma.payment.findMany({ where: orderId ? { orderId } : {}, orderBy: { createdAt: 'desc' } });
  }
}
