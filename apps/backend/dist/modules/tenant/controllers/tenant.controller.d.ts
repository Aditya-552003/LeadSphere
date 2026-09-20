import { TenantService } from '../services/tenant.service';
import { TenantStatus } from '../entities/tenant.entity';
export declare class TenantController {
    private readonly tenantService;
    constructor(tenantService: TenantService);
    registerCompany(body: {
        companyName: string;
        domain?: string;
        adminName: string;
        adminEmail: string;
        password?: string;
        plan?: string;
    }): Promise<{
        data: {
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
        };
    }>;
    findAll(): Promise<{
        data: import("../entities/tenant.entity").Tenant[];
    }>;
    findOne(id: string): Promise<{
        data: import("../entities/tenant.entity").Tenant;
    }>;
    create(body: {
        name: string;
        slug: string;
    }): Promise<{
        data: import("../entities/tenant.entity").Tenant;
    }>;
    updateStatus(id: string, status: TenantStatus): Promise<{
        data: import("../entities/tenant.entity").Tenant;
    }>;
}
