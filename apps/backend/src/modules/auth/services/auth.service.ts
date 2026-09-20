import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

import { User } from '../../user/entities/user.entity';
import { Membership } from '../../user/entities/membership.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Session } from '../entities/session.entity';
import { LoginDto } from '../dto/login.dto';
import { VerifyMfaDto } from '../dto/verify-mfa.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await argon2.verify(user.password_hash, dto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.mfa_enabled) {
      return {
        mfa_required: true,
        user_id: user.id,
      };
    }

    return this.generateUserSession(user, ip, userAgent);
  }

  async verifyMfa(dto: VerifyMfaDto, ip?: string, userAgent?: string) {
    const user = await this.userRepository.findOne({ where: { id: dto.user_id } });
    if (!user || !user.mfa_secret) {
      throw new BadRequestException('MFA not configured for user');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: dto.totp_code,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid MFA token code');
    }

    return this.generateUserSession(user, ip, userAgent);
  }

  async setupMfa(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
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

  private async generateUserSession(user: User, ip?: string, userAgent?: string) {
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

  async googleLogin(dto: { email: string; name: string; avatar?: string; google_id?: string }, ip?: string, userAgent?: string) {
    if (!dto.email) {
      throw new BadRequestException('Google authentication failed: Email is required');
    }

    let user = await this.userRepository.findOne({ where: { email: dto.email } });

    if (!user) {
      // Create user from Google Profile
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

      // Create default tenant for user if not exists
      const tenantSlug = dto.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let tenant = await this.tenantRepository.findOne({ where: { slug: tenantSlug } });
      if (!tenant) {
        tenant = this.tenantRepository.create({
          name: `${dto.name || 'Company'}'s Workspace`,
          slug: tenantSlug || `tenant-${Date.now()}`,
          status: 'active' as any,
        });
        tenant = await this.tenantRepository.save(tenant);
      }

      // Create Membership as Company Admin
      const membership = this.membershipRepository.create({
        user_id: user.id,
        tenant_id: tenant.id,
        role_id: 'COMPANY_ADMIN',
      });
      await this.membershipRepository.save(membership);
    }

    return this.generateUserSession(user, ip, userAgent);
  }
}
