import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
export interface CreateAuditLogParams {
    tenantId: string;
    actorId: string;
    actorType?: 'user' | 'system' | 'super_admin_support';
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    supportSessionId?: string;
}
export declare class AuditService {
    private readonly auditRepository;
    constructor(auditRepository: Repository<AuditLog>);
    log(params: CreateAuditLogParams): Promise<AuditLog>;
    findByTenant(tenantId: string, limit?: number, offset?: number): Promise<{
        data: AuditLog[];
        total: number;
    }>;
}
