import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Membership } from '../../user/entities/membership.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Session } from '../entities/session.entity';
import { LoginDto } from '../dto/login.dto';
import { VerifyMfaDto } from '../dto/verify-mfa.dto';
export declare class AuthService {
    private readonly userRepository;
    private readonly membershipRepository;
    private readonly tenantRepository;
    private readonly sessionRepository;
    private readonly jwtService;
    constructor(userRepository: Repository<User>, membershipRepository: Repository<Membership>, tenantRepository: Repository<Tenant>, sessionRepository: Repository<Session>, jwtService: JwtService);
    login(dto: LoginDto, ip?: string, userAgent?: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: string;
            email: string;
            full_name: string;
            tenant_id: string;
            is_platform_admin: boolean;
        };
    } | {
        mfa_required: boolean;
        user_id: string;
    }>;
    verifyMfa(dto: VerifyMfaDto, ip?: string, userAgent?: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: string;
            email: string;
            full_name: string;
            tenant_id: string;
            is_platform_admin: boolean;
        };
    }>;
    setupMfa(userId: string): Promise<{
        secret_base32: string;
        qr_code: string;
    }>;
    private generateUserSession;
    googleLogin(dto: {
        email: string;
        name: string;
        avatar?: string;
        google_id?: string;
    }, ip?: string, userAgent?: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: string;
            email: string;
            full_name: string;
            tenant_id: string;
            is_platform_admin: boolean;
        };
    }>;
}
