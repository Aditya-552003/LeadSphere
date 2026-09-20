import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { VerifyMfaDto } from '../dto/verify-mfa.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, req: Request, res: Response): Promise<{
        data: {
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
        };
    }>;
    googleAuth(body: {
        email: string;
        name: string;
        avatar?: string;
        google_id?: string;
    }, req: Request, res: Response): Promise<{
        data: {
            access_token: string;
            refresh_token: string;
            user: {
                id: string;
                email: string;
                full_name: string;
                tenant_id: string;
                is_platform_admin: boolean;
            };
        };
    }>;
    verifyMfa(dto: VerifyMfaDto, req: Request, res: Response): Promise<{
        data: {
            access_token: string;
            refresh_token: string;
            user: {
                id: string;
                email: string;
                full_name: string;
                tenant_id: string;
                is_platform_admin: boolean;
            };
        };
    }>;
    setupMfa(userId: string): Promise<{
        data: {
            secret_base32: string;
            qr_code: string;
        };
    }>;
    logout(res: Response): Promise<{
        data: {
            message: string;
        };
    }>;
}
