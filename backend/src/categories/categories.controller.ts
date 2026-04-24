import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

class CreateCategoryDto {
  @IsString() storeId!: string;
  @IsString() name!: string;
}

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  @Get()
  list(@Query('storeId') storeId: string) {
    return this.prisma.category.findMany({ where: { storeId }, orderBy: { createdAt: 'asc' } });
  }
}
