import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../entities/user.entity';
import { Membership } from '../entities/membership.entity';
import { Invitation } from '../entities/invitation.entity';
import { InviteUserDto } from '../dto/invite-user.dto';
import { AuditService } from '../../audit/services/audit.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly auditService: AuditService,
  ) {}

  async findTeamMembers(tenantId: string) {
    const memberships = await this.membershipRepository.find({ where: { tenant_id: tenantId } });
    const userIds = memberships.map((m) => m.user_id);

    if (userIds.length === 0) {
      return [];
    }

    const users = await this.userRepository.findByIds(userIds);

    return memberships.map((m) => {
      const u = users.find((user) => user.id === m.user_id);
      return {
        membership_id: m.id,
        user_id: u?.id,
        email: u?.email,
        full_name: u?.full_name,
        role_id: m.role_id,
        status: m.status,
        last_active_at: m.last_active_at,
        created_at: m.created_at,
      };
    });
  }

  async inviteUser(tenantId: string, actorId: string, dto: InviteUserDto) {
    let user = await this.userRepository.findOne({ where: { email: dto.email } });

    if (!user) {
      const defaultPasswordHash = await argon2.hash('TempPassword123!');
      user = this.userRepository.create({
        email: dto.email,
        full_name: dto.full_name,
        password_hash: defaultPasswordHash,
        status: 'active',
      });
      user = await this.userRepository.save(user);
    }

    const existingMembership = await this.membershipRepository.findOne({
      where: { tenant_id: tenantId, user_id: user.id },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already a member of this workspace');
    }

    const membership = this.membershipRepository.create({
      tenant_id: tenantId,
      user_id: user.id,
      role_id: dto.role_id,
      status: 'active',
    });
    await this.membershipRepository.save(membership);

    await this.auditService.log({
      tenantId,
      actorId,
      action: 'USER_INVITED',
      entityType: 'membership',
      entityId: membership.id,
      metadata: { email: dto.email, role_id: dto.role_id },
    });

    return {
      message: 'User added to workspace successfully',
      membership_id: membership.id,
      email: user.email,
    };
  }

  async updateUserRole(tenantId: string, actorId: string, membershipId: string, roleId: string) {
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId, tenant_id: tenantId },
    });

    if (!membership) {
      throw new NotFoundException('Team member not found');
    }

    const oldRoleId = membership.role_id;
    membership.role_id = roleId;
    await this.membershipRepository.save(membership);

    await this.auditService.log({
      tenantId,
      actorId,
      action: 'ROLE_CHANGED',
      entityType: 'membership',
      entityId: membership.id,
      metadata: { old_role_id: oldRoleId, new_role_id: roleId },
    });

    return membership;
  }

  async deactivateMember(tenantId: string, actorId: string, membershipId: string) {
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId, tenant_id: tenantId },
    });

    if (!membership) {
      throw new NotFoundException('Team member not found');
    }

    membership.status = 'deactivated';
    await this.membershipRepository.save(membership);

    await this.auditService.log({
      tenantId,
      actorId,
      action: 'USER_DEACTIVATED',
      entityType: 'membership',
      entityId: membership.id,
    });

    return { message: 'User deactivated successfully' };
  }
}
