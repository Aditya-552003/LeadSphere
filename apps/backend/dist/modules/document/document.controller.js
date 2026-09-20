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
exports.DocumentController = void 0;
const common_1 = require("@nestjs/common");
const document_service_1 = require("./document.service");
let DocumentController = class DocumentController {
    constructor(documentService) {
        this.documentService = documentService;
    }
    async getDocuments(req, folder) {
        const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
        return this.documentService.getDocuments(tenantId, folder);
    }
    async getDocumentById(req, id) {
        const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
        return this.documentService.getDocumentById(tenantId, id);
    }
    async getPresignedUploadUrl(req, body) {
        const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
        const userId = req.user?.id;
        return this.documentService.getPresignedUploadUrl(tenantId, body.title, body.fileName, body.mimeType, body.fileSize, body.folder, body.description, userId);
    }
    async getPresignedDownloadUrl(req, id) {
        const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
        return this.documentService.getPresignedDownloadUrl(tenantId, id);
    }
    async uploadNewVersion(req, id, body) {
        const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
        const userId = req.user?.id || '00000000-0000-0000-0000-000000000002';
        return this.documentService.uploadNewVersion(tenantId, id, userId, body.fileName, body.fileSize, body.changeSummary);
    }
    async deleteDocument(req, id) {
        const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';
        return this.documentService.deleteDocument(tenantId, id);
    }
};
exports.DocumentController = DocumentController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getDocuments", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getDocumentById", null);
__decorate([
    (0, common_1.Post)('presigned-upload'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getPresignedUploadUrl", null);
__decorate([
    (0, common_1.Get)(':id/presigned-download'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getPresignedDownloadUrl", null);
__decorate([
    (0, common_1.Post)(':id/versions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "uploadNewVersion", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "deleteDocument", null);
exports.DocumentController = DocumentController = __decorate([
    (0, common_1.Controller)('documents'),
    __metadata("design:paramtypes", [document_service_1.DocumentService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map