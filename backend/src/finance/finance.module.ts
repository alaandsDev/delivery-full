import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FinanceController } from './finance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
})
export class FinanceModule {}

