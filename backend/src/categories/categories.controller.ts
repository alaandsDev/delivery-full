import { Body, Controller, Get, Post, Query, ForbiddenException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/guards/jwt.guard';
import { CurrentUser, } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/guards/jwt.guard';

class CreateCategoryDto {
  @IsString() storeId!: string;
  @IsString() name!: string;
}

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  list(@Query('storeId') storeId: string) {
    return this.prisma.category.findMany({ where: { storeId }, orderBy: { createdAt: 'asc' } });
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: JwtPayload) {
    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    if (!store || store.ownerId !== user.id) throw new ForbiddenException();
    return this.prisma.category.create({ data: dto });
  }
}
