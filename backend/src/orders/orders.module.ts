import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({ imports: [PrismaModule, EventsModule], controllers: [OrdersController] })
export class OrdersModule {}
