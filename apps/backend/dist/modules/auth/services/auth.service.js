"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const argon2 = require("argon2");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const user_entity_1 = require("../../user/entities/user.entity");
const membership_entity_1 = require("../../user/entities/membership.entity");
const tenant_entity_1 = require("../../tenant/entities/tenant.entity");
const session_entity_1 = require("../entities/session.entity");
let AuthService = class AuthService {
    constructor(userRepository, membershipRepository, tenantRepository, sessionRepository, jwtService) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.tenantRepository = tenantRepository;
        this.sessionRepository = sessionRepository;
        this.jwtService = jwtService;
    }
    async login(dto, ip, userAgent) {
        const user = await this.userRepository.findOne({ where: { email: dto.email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const isValidPassword = await argon2.verify(user.password_hash, dto.password);
        if (!isValidPassword) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.mfa_enabled) {
            return {
                mfa_required: true,
                user_id: user.id,
            };
        }
        return this.generateUserSession(user, ip, userAgent);
    }
    async verifyMfa(dto, ip, userAgent) {
        const user = await this.userRepository.findOne({ where: { id: dto.user_id } });
        if (!user || !user.mfa_secret) {
            throw new common_1.BadRequestException('MFA not configured for user');
        }
        const verified = speakeasy.totp.verify({
            secret: user.mfa_secret,
            encoding: 'base32',
            token: dto.totp_code,
        });
        if (!verified) {
            throw new common_1.UnauthorizedException('Invalid MFA token code');
        }
        return this.generateUserSession(user, ip, userAgent);
    }
    async setupMfa(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const secret = speakeasy.generateSecret({
            name: `LeadSphere (${user.email})`,
        });
        user.mfa_secret = secret.base32;
        await this.userRepository.save(user);
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        return {
            secret_base32: secret.base32,
            qr_code: qrCodeUrl,
        };
    }
    async generateUserSession(user, ip, userAgent) {
        const membership = await this.membershipRepository.findOne({ where: { user_id: user.id } });
        const tenantId = membership ? membership.tenant_id : null;
        const role = membership ? membership.role_id : 'member';
        const session = this.sessionRepository.create({
            user_id: user.id,
            tenant_id: tenantId,
            refresh_hash: 'temp',
            ip,
            user_agent: userAgent,
        });
        await this.sessionRepository.save(session);
        const payload = {
            sub: user.id,
            tenant_id: tenantId,
            membership_id: membership ? membership.id : null,
            role: role,
            session_id: session.id,
            is_platform_admin: user.is_platform_admin,
        };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
        session.refresh_hash = await argon2.hash(refreshToken);
        await this.sessionRepository.save(session);
        user.last_login_at = new Date();
        await this.userRepository.save(user);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                tenant_id: tenantId,
                is_platform_admin: user.is_platform_admin,
            },
        };
    }
    async googleLogin(dto, ip, userAgent) {
        if (!dto.email) {
            throw new common_1.BadRequestException('Google authentication failed: Email is required');
        }
        let user = await this.userRepository.findOne({ where: { email: dto.email } });
        if (!user) {
            const randomPass = Math.random().toString(36).slice(-10) + 'A1!';
            const hash = await argon2.hash(randomPass);
            user = this.userRepository.create({
                email: dto.email,
                full_name: dto.name || dto.email.split('@')[0],
                password_hash: hash,
                status: 'active',
                is_platform_admin: dto.email === 'admin@leadsphere.io',
            });
            user = await this.userRepository.save(user);
            const tenantSlug = dto.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            let tenant = await this.tenantRepository.findOne({ where: { slug: tenantSlug } });
            if (!tenant) {
                tenant = this.tenantRepository.create({
                    name: `${dto.name || 'Company'}'s Workspace`,
                    slug: tenantSlug || `tenant-${Date.now()}`,
                    status: 'active',
                });
                tenant = await this.tenantRepository.save(tenant);
            }
            const membership = this.membershipRepository.create({
                user_id: user.id,
                tenant_id: tenant.id,
                role_id: 'COMPANY_ADMIN',
            });
            await this.membershipRepository.save(membership);
        }
        return this.generateUserSession(user, ip, userAgent);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(membership_entity_1.Membership)),
    __param(2, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __param(3, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map