import { RbacService } from '../services/rbac.service';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';
export declare class RbacController {
    private readonly rbacService;
    constructor(rbacService: RbacService);
    findRoles(ctx: ITenantContext): Promise<{
        data: import("../entities/role.entity").Role[];
    }>;
    findPermissions(): Promise<{
        data: import("../entities/permission.entity").Permission[];
    }>;
    createRole(ctx: ITenantContext, body: {
        name: string;
        description?: string;
    }): Promise<{
        data: import("../entities/role.entity").Role;
    }>;
}
