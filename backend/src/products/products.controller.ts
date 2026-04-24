import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

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
}

@Controller('products')
export class ProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  @Get()
  list(@Query('storeId') storeId: string) {
    return this.prisma.product.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.prisma.product.update({ where: { id }, data: dto });
  }
}
