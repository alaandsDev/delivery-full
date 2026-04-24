import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [LeadsController] })
export class LeadsModule {}
