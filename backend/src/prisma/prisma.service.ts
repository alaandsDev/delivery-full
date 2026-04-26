import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('Rodando prisma db push...');
    try {
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        stdio: 'inherit',
        env: process.env,
      });
      this.logger.log('Banco sincronizado com sucesso.');
    } catch (err) {
      this.logger.error('Falha ao sincronizar banco:', err);
    }
    await this.$connect();
  }
}
