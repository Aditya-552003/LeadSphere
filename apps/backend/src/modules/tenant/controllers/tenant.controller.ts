import { Controller, Get, Post, Body, Param, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { TenantStatus } from '../entities/tenant.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('platform/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerCompany(
    @Body()
    body: {
      companyName: string;
      domain?: string;
      adminName: string;
      adminEmail: string;
      password?: string;
      plan?: string;
    },
  ) {
    const domain = body.domain || body.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const result = await this.tenantService.registerCompany(
      body.companyName,
      domain,
      body.adminName,
      body.adminEmail,
      body.password,
      body.plan || 'pro',
    );
    return { data: result };
  }

  @Public()
  @Get()
  async findAll() {
    const tenants = await this.tenantService.findAll();
    return { data: tenants };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tenant = await this.tenantService.findOne(id);
    return { data: tenant };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: { name: string; slug: string }) {
    const tenant = await this.tenantService.create(body.name, body.slug);
    return { data: tenant };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: TenantStatus) {
    const tenant = await this.tenantService.updateStatus(id, status);
    return { data: tenant };
  }
}
