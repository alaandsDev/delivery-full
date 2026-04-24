import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getRoot() {
    return {
      name: 'Delivery SaaS API',
      status: 'online',
      environment: this.configService.get<string>('app.env'),
      healthcheck: '/api/v1/health',
    };
  }
}
