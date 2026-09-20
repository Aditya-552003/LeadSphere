export declare class Invitation {
    id: string;
    tenant_id: string;
    email: string;
    role_id: string;
    token_hash: string;
    expires_at: Date;
    accepted_at: Date;
    revoked_at: Date;
    invited_by: string;
    created_at: Date;
}
