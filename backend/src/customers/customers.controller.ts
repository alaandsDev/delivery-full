import { Body, Controller, Get, Post, Query, ForbiddenException } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/guards/jwt.guard';

class UpsertCustomerDto {
  @IsString() storeId!: string;
  @IsString() phone!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() address?: string;
}

@Controller('customers')
export class CustomersController {
  constructor(private readonly prisma: PrismaService) {}

  // Público — cardápio busca cliente pelo telefone para preencher dados
  @Public()
  @Get('lookup')
  async lookup(
    @Query('storeId') storeId: string,
    @Query('phone') phone: string,
  ) {
    if (!storeId || !phone) return null;
    return this.prisma.customer.findUnique({
      where: { storeId_phone: { storeId, phone: phone.replace(/\D/g, '') } },
    });
  }

  // Público — upsert ao finalizar pedido
  @Public()
  @Post('upsert')
  async upsert(@Body() dto: UpsertCustomerDto) {
    const phone = dto.phone.replace(/\D/g, '');
    return this.prisma.customer.upsert({
      where: { storeId_phone: { storeId: dto.storeId, phone } },
      update: { name: dto.name, address: dto.address ?? undefined },
      create: { storeId: dto.storeId, phone, name: dto.name, address: dto.address },
    });
  }

  // Autenticado — lojista lista clientes da sua loja
  @Get()
  async list(@Query('storeId') storeId: string, @CurrentUser() user: JwtPayload) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.ownerId !== user.id) throw new ForbiddenException();
    return this.prisma.customer.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
