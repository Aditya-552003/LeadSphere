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
exports.ImportExportController = void 0;
const common_1 = require("@nestjs/common");
const import_export_service_1 = require("../services/import-export.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const tenant_context_decorator_1 = require("../../../common/decorators/tenant-context.decorator");
let ImportExportController = class ImportExportController {
    constructor(importExportService) {
        this.importExportService = importExportService;
    }
    async autoMap(headers) {
        const mapping = this.importExportService.autoDetectMapping(headers || []);
        return { data: mapping };
    }
    async processImport(ctx, body) {
        const job = await this.importExportService.processCsvImport(ctx.tenantId, ctx.userId, body.filename || 'import.csv', body.csvContent || '', body.columnMapping || {}, body.deduplicationMode || 'skip');
        return { data: job };
    }
    async getImports(ctx) {
        const jobs = await this.importExportService.getImportJobs(ctx.tenantId);
        return { data: jobs };
    }
    async downloadErrorReport(ctx, id, res) {
        const csv = await this.importExportService.getImportErrorReportCsv(ctx.tenantId, id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="import_errors_${id}.csv"`);
        res.send(csv);
    }
    async processExport(ctx, res) {
        const { job, csv } = await this.importExportService.processCsvExport(ctx.tenantId, ctx.userId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="leadsphere_export_${Date.now()}.csv"`);
        res.send(csv);
    }
    async getExports(ctx) {
        const jobs = await this.importExportService.getExportJobs(ctx.tenantId);
        return { data: jobs };
    }
};
exports.ImportExportController = ImportExportController;
__decorate([
    (0, common_1.Post)('imports/auto-map'),
    (0, require_permission_decorator_1.RequirePermission)('leads.create'),
    __param(0, (0, common_1.Body)('headers')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], ImportExportController.prototype, "autoMap", null);
__decorate([
    (0, common_1.Post)('imports'),
    (0, require_permission_decorator_1.RequirePermission)('leads.create'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ImportExportController.prototype, "processImport", null);
__decorate([
    (0, common_1.Get)('imports'),
    (0, require_permission_decorator_1.RequirePermission)('leads.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ImportExportController.prototype, "getImports", null);
__decorate([
    (0, common_1.Get)('imports/:id/error-report'),
    (0, require_permission_decorator_1.RequirePermission)('leads.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ImportExportController.prototype, "downloadErrorReport", null);
__decorate([
    (0, common_1.Post)('exports'),
    (0, require_permission_decorator_1.RequirePermission)('leads.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ImportExportController.prototype, "processExport", null);
__decorate([
    (0, common_1.Get)('exports'),
    (0, require_permission_decorator_1.RequirePermission)('leads.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ImportExportController.prototype, "getExports", null);
exports.ImportExportController = ImportExportController = __decorate([
    (0, common_1.Controller)('data'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [import_export_service_1.ImportExportService])
], ImportExportController);
//# sourceMappingURL=import-export.controller.js.map