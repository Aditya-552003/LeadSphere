export declare class Session {
    id: string;
    user_id: string;
    tenant_id: string;
    refresh_hash: string;
    device: string;
    ip: string;
    user_agent: string;
    last_seen_at: Date;
    revoked_at: Date;
    created_at: Date;
}
