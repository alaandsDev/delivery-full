import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [StoresController] })
export class StoresModule {}
