import { Strategy } from 'passport-jwt';
export interface JwtPayload {
    sub: string;
    tenant_id: string;
    membership_id: string;
    role: string;
    session_id: string;
    is_platform_admin: boolean;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: JwtPayload): Promise<{
        userId: string;
        tenantId: string;
        membershipId: string;
        role: string;
        sessionId: string;
        isPlatformAdmin: boolean;
    }>;
}
export {};
