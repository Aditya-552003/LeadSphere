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
exports.PipelineController = void 0;
const common_1 = require("@nestjs/common");
const pipeline_service_1 = require("../services/pipeline.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const tenant_context_decorator_1 = require("../../../common/decorators/tenant-context.decorator");
let PipelineController = class PipelineController {
    constructor(pipelineService) {
        this.pipelineService = pipelineService;
    }
    async findStages(ctx) {
        const stages = await this.pipelineService.findStages(ctx.tenantId);
        return { data: stages };
    }
    async createStage(ctx, body) {
        const stage = await this.pipelineService.createStage(ctx.tenantId, body.name, body.color, body.probability);
        return { data: stage };
    }
};
exports.PipelineController = PipelineController;
__decorate([
    (0, common_1.Get)('stages'),
    (0, require_permission_decorator_1.RequirePermission)('pipeline.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PipelineController.prototype, "findStages", null);
__decorate([
    (0, common_1.Post)('stages'),
    (0, require_permission_decorator_1.RequirePermission)('pipeline.manage'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PipelineController.prototype, "createStage", null);
exports.PipelineController = PipelineController = __decorate([
    (0, common_1.Controller)('pipeline'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [pipeline_service_1.PipelineService])
], PipelineController);
//# sourceMappingURL=pipeline.controller.js.map