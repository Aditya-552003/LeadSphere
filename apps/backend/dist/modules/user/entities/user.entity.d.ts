export declare class User {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    is_platform_admin: boolean;
    mfa_enabled: boolean;
    mfa_secret: string;
    status: string;
    last_login_at: Date;
    created_at: Date;
    updated_at: Date;
}
