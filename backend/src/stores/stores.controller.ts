import { Body, Controller, Get, Param, Patch, Post, ForbiddenException } from '@nestjs/common';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/guards/jwt.guard';

class CreateStoreDto {
  @IsString() name!: string;
  @IsString() slug!: string;
  @IsOptional() @IsString() description?: string;
}

class UpdateStoreDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() whatsappNumber?: string;
  @IsOptional() @IsInt() @Min(0) deliveryFee?: number;
  @IsOptional() @IsInt() @Min(0) minOrderCents?: number;
  @IsOptional() @IsString() openingHours?: string;
}

@Controller('stores')
export class StoresController {
  constructor(private readonly prisma: PrismaService) {}

  // Autenticado — ownerId vem do token, não do body (seguro)
  @Post()
  create(@Body() dto: CreateStoreDto, @CurrentUser() user: JwtPayload) {
    return this.prisma.store.create({
      data: { ...dto, ownerId: user.id },
    });
  }

  // Pública — cardápio precisa buscar por slug sem auth
  @Public()
  @Get('by-slug/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.prisma.store.findUnique({ where: { slug } });
  }

  // Pública — login precisa buscar loja do usuário
  @Public()
  @Get('by-owner/:ownerId')
  byOwner(@Param('ownerId') ownerId: string) {
    return this.prisma.store.findUnique({ where: { ownerId } });
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.prisma.store.findUnique({ where: { id } });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store || store.ownerId !== user.id) throw new ForbiddenException();
    return this.prisma.store.update({ where: { id }, data: dto });
  }
}
