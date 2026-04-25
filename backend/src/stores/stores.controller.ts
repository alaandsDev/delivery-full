import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

class CreateStoreDto {
  @IsString() name!: string;
  @IsString() slug!: string;
  @IsString() ownerId!: string;
  @IsOptional() @IsString() description?: string;
}

class UpdateStoreDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
}

@Controller('stores')
export class StoresController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateStoreDto) {
    return this.prisma.store.create({ data: dto });
  }

  @Get()
  list() {
    return this.prisma.store.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Get('by-owner/:ownerId')
  byOwner(@Param('ownerId') ownerId: string) {
    return this.prisma.store.findUnique({ where: { ownerId } });
  }

  @Get('by-slug/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.prisma.store.findUnique({ where: { slug } });
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.prisma.store.findUnique({ where: { id } });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.prisma.store.update({ where: { id }, data: dto });
  }
}
