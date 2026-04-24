import { Body, Controller, Get, Patch, Post, Query, Param } from '@nestjs/common';
import { IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

class CreateNotificationDto {
  @IsString() storeId!: string;
  @IsString() type!: string;
  @IsString() title!: string;
  @IsString() message!: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: dto });
  }

  @Get()
  list(@Query('storeId') storeId: string) {
    return this.prisma.notification.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } });
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
}
