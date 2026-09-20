import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  getHealth() {
    return {
      status: 'ok',
      service: 'LeadSphere Multi-Tenant SaaS Backend',
      version: '1.6.0',
      timestamp: new Date().toISOString(),
      docs: '/api/docs',
    };
  }
}
