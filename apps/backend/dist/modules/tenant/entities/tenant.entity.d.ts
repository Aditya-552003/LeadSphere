export declare enum TenantStatus {
    PROVISIONING = "provisioning",
    ACTIVE = "active",
    SUSPENDED = "suspended",
    PENDING_DELETION = "pending_deletion",
    DELETED = "deleted"
}
export declare class Tenant {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    plan: string;
    timezone: string;
    currency: string;
    branding: Record<string, any>;
    settings: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
