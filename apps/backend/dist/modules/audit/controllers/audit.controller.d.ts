import { AuditService } from '../services/audit.service';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(ctx: ITenantContext, limit?: number, offset?: number): Promise<{
        data: import("../entities/audit-log.entity").AuditLog[];
        total: number;
    }>;
}
