import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
export declare class TenantService {
    private readonly tenantRepository;
    constructor(tenantRepository: Repository<Tenant>);
    findAll(): Promise<Tenant[]>;
    findOne(id: string): Promise<Tenant>;
    create(name: string, slug: string): Promise<Tenant>;
    registerCompany(companyName: string, domain: string, adminName: string, adminEmail: string, password?: string, plan?: string): Promise<{
        message: string;
        tenant: {
            id: string;
            name: string;
            slug: string;
            plan: string;
            status: TenantStatus;
        };
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
        };
        access_token: string;
        workspace_url: string;
    }>;
    updateStatus(id: string, status: TenantStatus): Promise<Tenant>;
}
