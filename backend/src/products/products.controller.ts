import { Body, Controller, Get, Param, Patch, Post, Query, ForbiddenException } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/guards/jwt.guard';

class CreateProductDto {
  @IsString() storeId!: string;
  @IsString() categoryId!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(1) priceCents!: number;
}

class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) priceCents?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() categoryId?: string;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly prisma: PrismaService) {}

  // Cardápio público pode listar produtos sem auth
  @Public()
  @Get()
  list(@Query('storeId') storeId: string) {
    return this.prisma.product.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } });
  }

  @Post()
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayload) {
    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    if (!store || store.ownerId !== user.id) throw new ForbiddenException();
    return this.prisma.product.create({ data: dto });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: { store: true } });
    if (!product || product.store.ownerId !== user.id) throw new ForbiddenException();
    return this.prisma.product.update({ where: { id }, data: dto });
  }
}
