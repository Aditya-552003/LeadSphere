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
exports.FollowupController = void 0;
const common_1 = require("@nestjs/common");
const followup_service_1 = require("../services/followup.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const tenant_context_decorator_1 = require("../../../common/decorators/tenant-context.decorator");
let FollowupController = class FollowupController {
    constructor(followupService) {
        this.followupService = followupService;
    }
    async findAll(ctx, filterType) {
        const followups = await this.followupService.findAll(ctx.tenantId, filterType);
        return { data: followups };
    }
    async getCalendarEvents(ctx, start, end) {
        const events = await this.followupService.getCalendarEvents(ctx.tenantId, start, end);
        return { data: events };
    }
    async create(ctx, body) {
        const followup = await this.followupService.create(ctx.tenantId, ctx.userId, body);
        return { data: followup };
    }
    async markCompleted(ctx, id) {
        const followup = await this.followupService.markCompleted(ctx.tenantId, ctx.userId, id);
        return { data: followup };
    }
    async snooze(ctx, id, snoozeHours) {
        const followup = await this.followupService.snooze(ctx.tenantId, id, snoozeHours || 24);
        return { data: followup };
    }
    async remove(ctx, id) {
        const result = await this.followupService.remove(ctx.tenantId, id);
        return { data: result };
    }
};
exports.FollowupController = FollowupController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('leads.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('filterType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FollowupController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('calendar'),
    (0, require_permission_decorator_1.RequirePermission)('leads.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('start')),
    __param(2, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], FollowupController.prototype, "getCalendarEvents", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('leads.update'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FollowupController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, require_permission_decorator_1.RequirePermission)('leads.update'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FollowupController.prototype, "markCompleted", null);
__decorate([
    (0, common_1.Post)(':id/snooze'),
    (0, require_permission_decorator_1.RequirePermission)('leads.update'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('snoozeHours')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], FollowupController.prototype, "snooze", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('leads.update'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FollowupController.prototype, "remove", null);
exports.FollowupController = FollowupController = __decorate([
    (0, common_1.Controller)('followups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [followup_service_1.FollowupService])
], FollowupController);
//# sourceMappingURL=followup.controller.js.map