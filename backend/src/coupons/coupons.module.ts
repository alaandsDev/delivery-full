import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [CouponsController] })
export class CouponsModule {}
