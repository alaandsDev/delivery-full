import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

class CreateLeadDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
}

@Controller('leads')
export class LeadsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.prisma.merchantLead.create({ data: dto });
  }

  @Get()
  list() {
    return this.prisma.merchantLead.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
