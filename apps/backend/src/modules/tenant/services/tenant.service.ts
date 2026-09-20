import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async findAll() {
    return this.tenantRepository.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' not found`);
    }
    return tenant;
  }

  async create(name: string, slug: string) {
    const existing = await this.tenantRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Company workspace domain '${slug}' already exists.`);
    }
    const tenant = this.tenantRepository.create({ name, slug, status: TenantStatus.ACTIVE });
    return this.tenantRepository.save(tenant);
  }

  async registerCompany(
    companyName: string,
    domain: string,
    adminName: string,
    adminEmail: string,
    password?: string,
    plan: string = 'pro',
  ) {
    const slug = domain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const existing = await this.tenantRepository.findOne({ where: { slug } });

    let tenant: Tenant;
    if (existing) {
      tenant = existing;
    } else {
      tenant = this.tenantRepository.create({
        name: companyName,
        slug,
        status: TenantStatus.ACTIVE,
      });
      tenant = await this.tenantRepository.save(tenant);
    }

    const userId = `usr_${Date.now()}`;
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_leadsphere_dev';

    // Generate JWT token for newly provisioned Company Admin
    const accessToken = jwt.sign(
      {
        sub: userId,
        email: adminEmail,
        name: adminName,
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        tenant_slug: tenant.slug,
        role: 'COMPANY_ADMIN',
      },
      jwtSecret,
      { expiresIn: '15m' },
    );

    return {
      message: 'Company workspace provisioned successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan,
        status: tenant.status,
      },
      user: {
        id: userId,
        name: adminName,
        email: adminEmail,
        role: 'COMPANY_ADMIN',
      },
      access_token: accessToken,
      workspace_url: `/app/dashboard?tenant=${tenant.slug}`,
    };
  }

  async updateStatus(id: string, status: TenantStatus) {
    const tenant = await this.findOne(id);
    tenant.status = status;
    return this.tenantRepository.save(tenant);
  }
}
