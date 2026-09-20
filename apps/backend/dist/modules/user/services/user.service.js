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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const argon2 = require("argon2");
const user_entity_1 = require("../entities/user.entity");
const membership_entity_1 = require("../entities/membership.entity");
const invitation_entity_1 = require("../entities/invitation.entity");
const audit_service_1 = require("../../audit/services/audit.service");
let UserService = class UserService {
    constructor(userRepository, membershipRepository, invitationRepository, auditService) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.invitationRepository = invitationRepository;
        this.auditService = auditService;
    }
    async findTeamMembers(tenantId) {
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
    async inviteUser(tenantId, actorId, dto) {
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
            throw new common_1.BadRequestException('User is already a member of this workspace');
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
    async updateUserRole(tenantId, actorId, membershipId, roleId) {
        const membership = await this.membershipRepository.findOne({
            where: { id: membershipId, tenant_id: tenantId },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Team member not found');
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
    async deactivateMember(tenantId, actorId, membershipId) {
        const membership = await this.membershipRepository.findOne({
            where: { id: membershipId, tenant_id: tenantId },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Team member not found');
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
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(membership_entity_1.Membership)),
    __param(2, (0, typeorm_1.InjectRepository)(invitation_entity_1.Invitation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService])
], UserService);
//# sourceMappingURL=user.service.js.map