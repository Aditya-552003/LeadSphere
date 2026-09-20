export declare class AuditLog {
    id: string;
    tenant_id: string;
    actor_id: string;
    actor_type: 'user' | 'system' | 'super_admin_support';
    on_behalf_of_tenant: string;
    support_session_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    metadata: Record<string, any>;
    ip_address: string;
    user_agent: string;
    request_id: string;
    created_at: Date;
}
