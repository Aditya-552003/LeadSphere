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
exports.LeadController = void 0;
const common_1 = require("@nestjs/common");
const lead_service_1 = require("../services/lead.service");
const create_lead_dto_1 = require("../dto/create-lead.dto");
const update_lead_dto_1 = require("../dto/update-lead.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const tenant_context_decorator_1 = require("../../../common/decorators/tenant-context.decorator");
let LeadController = class LeadController {
    constructor(leadService) {
        this.leadService = leadService;
    }
    async findAll(ctx, q, limit = 50, cursor) {
        const result = await this.leadService.findAll(ctx.tenantId, q, +limit, cursor);
        return result;
    }
    async findOne(ctx, id) {
        const lead = await this.leadService.findOne(ctx.tenantId, id);
        return { data: lead };
    }
    async create(ctx, dto) {
        const lead = await this.leadService.create(ctx.tenantId, ctx.userId, dto);
        return { data: lead };
    }
    async update(ctx, id, dto) {
        const lead = await this.leadService.update(ctx.tenantId, ctx.userId, id, dto);
        return { data: lead };
    }
    async remove(ctx, id) {
        const result = await this.leadService.remove(ctx.tenantId, ctx.userId, id);
        return { data: result };
    }
    async getTimeline(ctx, id) {
        const timeline = await this.leadService.getTimeline(ctx.tenantId, id);
        return { data: timeline };
    }
    async addNote(ctx, id, body) {
        const note = await this.leadService.addNote(ctx.tenantId, id, ctx.membershipId, body);
        return { data: note };
    }
};
exports.LeadController = LeadController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('leads.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('cursor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, String]),
    __metadata("design:returntype", Promise)
], LeadController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('leads.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LeadController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('leads.create'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_lead_dto_1.CreateLeadDto]),
    __metadata("design:returntype", Promise)
], LeadController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('leads.update'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_lead_dto_1.UpdateLeadDto]),
    __metadata("design:returntype", Promise)
], LeadController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('leads.delete'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LeadController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    (0, require_permission_decorator_1.RequirePermission)('leads.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LeadController.prototype, "getTimeline", null);
__decorate([
    (0, common_1.Post)(':id/notes'),
    (0, require_permission_decorator_1.RequirePermission)('leads.update'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('body')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], LeadController.prototype, "addNote", null);
exports.LeadController = LeadController = __decorate([
    (0, common_1.Controller)('leads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [lead_service_1.LeadService])
], LeadController);
//# sourceMappingURL=lead.controller.js.map