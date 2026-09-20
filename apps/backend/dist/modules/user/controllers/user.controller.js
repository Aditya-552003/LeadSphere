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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../services/user.service");
const invite_user_dto_1 = require("../dto/invite-user.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const tenant_context_decorator_1 = require("../../../common/decorators/tenant-context.decorator");
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async findTeamMembers(ctx) {
        const members = await this.userService.findTeamMembers(ctx.tenantId);
        return { data: members };
    }
    async inviteUser(ctx, dto) {
        const result = await this.userService.inviteUser(ctx.tenantId, ctx.userId, dto);
        return { data: result };
    }
    async updateUserRole(ctx, membershipId, roleId) {
        const result = await this.userService.updateUserRole(ctx.tenantId, ctx.userId, membershipId, roleId);
        return { data: result };
    }
    async deactivateMember(ctx, membershipId) {
        const result = await this.userService.deactivateMember(ctx.tenantId, ctx.userId, membershipId);
        return { data: result };
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('users'),
    (0, require_permission_decorator_1.RequirePermission)('users.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findTeamMembers", null);
__decorate([
    (0, common_1.Post)('invitations'),
    (0, require_permission_decorator_1.RequirePermission)('users.create'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, invite_user_dto_1.InviteUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "inviteUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    (0, require_permission_decorator_1.RequirePermission)('users.update'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('role_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Post)('users/:id/deactivate'),
    (0, require_permission_decorator_1.RequirePermission)('users.delete'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deactivateMember", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('team'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map