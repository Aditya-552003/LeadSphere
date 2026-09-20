import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(params: CreateAuditLogParams): Promise<AuditLog> {
    const entry = this.auditRepository.create({
      tenant_id: params.tenantId,
      actor_id: params.actorId,
      actor_type: params.actorType || 'user',
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      metadata: params.metadata || {},
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      request_id: params.requestId,
      support_session_id: params.supportSessionId,
    });

    return this.auditRepository.save(entry);
  }

  async findByTenant(tenantId: string, limit = 50, offset = 0) {
    const [data, total] = await this.auditRepository.findAndCount({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { data, total };
  }
}
