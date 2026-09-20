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
exports.CampaignController = void 0;
const common_1 = require("@nestjs/common");
const campaign_service_1 = require("../services/campaign.service");
const campaign_entity_1 = require("../entities/campaign.entity");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const tenant_context_decorator_1 = require("../../../common/decorators/tenant-context.decorator");
let CampaignController = class CampaignController {
    constructor(campaignService) {
        this.campaignService = campaignService;
    }
    async findTemplates(ctx) {
        const templates = await this.campaignService.findTemplates(ctx.tenantId);
        return { data: templates };
    }
    async createTemplate(ctx, body) {
        const template = await this.campaignService.createTemplate(ctx.tenantId, ctx.userId, body);
        return { data: template };
    }
    async deleteTemplate(ctx, id) {
        const result = await this.campaignService.deleteTemplate(ctx.tenantId, id);
        return { data: result };
    }
    async findCampaigns(ctx) {
        const campaigns = await this.campaignService.findCampaigns(ctx.tenantId);
        return { data: campaigns };
    }
    async createCampaign(ctx, body) {
        const campaign = await this.campaignService.createCampaign(ctx.tenantId, ctx.userId, body);
        return { data: campaign };
    }
    async findCampaignById(ctx, id) {
        const campaign = await this.campaignService.findCampaignById(ctx.tenantId, id);
        return { data: campaign };
    }
    async updateStatus(ctx, id, status) {
        const campaign = await this.campaignService.updateCampaignStatus(ctx.tenantId, id, status);
        return { data: campaign };
    }
    async enrollLeads(ctx, id, leadIds) {
        const result = await this.campaignService.enrollLeads(ctx.tenantId, ctx.userId, id, leadIds);
        return { data: result };
    }
    async getAnalytics(ctx, id) {
        const analytics = await this.campaignService.getCampaignAnalytics(ctx.tenantId, id);
        return { data: analytics };
    }
};
exports.CampaignController = CampaignController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, require_permission_decorator_1.RequirePermission)('campaigns.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CampaignController.prototype, "findTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, require_permission_decorator_1.RequirePermission)('campaigns.manage'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CampaignController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, require_permission_decorator_1.RequirePermission)('campaigns.manage'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CampaignController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('campaigns.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CampaignController.prototype, "findCampaigns", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('campaigns.manage'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CampaignController.prototype, "createCampaign", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('campaigns.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CampaignController.prototype, "findCampaignById", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, require_permission_decorator_1.RequirePermission)('campaigns.manage'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CampaignController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/enroll'),
    (0, require_permission_decorator_1.RequirePermission)('campaigns.manage'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('leadIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", Promise)
], CampaignController.prototype, "enrollLeads", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    (0, require_permission_decorator_1.RequirePermission)('campaigns.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CampaignController.prototype, "getAnalytics", null);
exports.CampaignController = CampaignController = __decorate([
    (0, common_1.Controller)('campaigns'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [campaign_service_1.CampaignService])
], CampaignController);
//# sourceMappingURL=campaign.controller.js.map