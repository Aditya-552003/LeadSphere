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
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const document_entity_1 = require("./entities/document.entity");
const document_version_entity_1 = require("./entities/document-version.entity");
let DocumentService = class DocumentService {
    constructor(documentRepo, versionRepo) {
        this.documentRepo = documentRepo;
        this.versionRepo = versionRepo;
    }
    async getDocuments(tenantId, folder) {
        let docs = await this.documentRepo.find({
            where: folder ? { tenant_id: tenantId, folder } : { tenant_id: tenantId },
            relations: ['versions'],
            order: { updated_at: 'DESC' },
        });
        if (docs.length === 0) {
            docs = await this.seedDefaultDocuments(tenantId);
        }
        return docs;
    }
    async getDocumentById(tenantId, id) {
        const doc = await this.documentRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['versions'],
        });
        if (!doc) {
            throw new common_1.NotFoundException(`Document with ID ${id} not found.`);
        }
        return doc;
    }
    async getPresignedUploadUrl(tenantId, title, fileName, mimeType, fileSize, folder = 'General', description, userId) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'leadsphere-vault';
        const s3Key = `tenants/${tenantId}/documents/${Date.now()}_${fileName}`;
        const mockCloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload?signature=mock_cloudinary_sig&timestamp=${Date.now()}`;
        const doc = this.documentRepo.create({
            tenant_id: tenantId,
            folder: folder || 'General',
            title: title || fileName,
            description: description || null,
            file_name: fileName,
            file_size: fileSize || 1024,
            mime_type: mimeType || 'application/octet-stream',
            s3_key: s3Key,
            current_version: 1,
            status: 'clean',
            created_by_user_id: userId || null,
        });
        const savedDoc = await this.documentRepo.save(doc);
        const version = this.versionRepo.create({
            tenant_id: tenantId,
            document_id: savedDoc.id,
            version: 1,
            file_name: fileName,
            file_size: fileSize || 1024,
            s3_key: s3Key,
            change_summary: 'Initial document upload',
            uploaded_by_user_id: userId || null,
        });
        await this.versionRepo.save(version);
        return {
            upload_url: mockCloudinaryUploadUrl,
            provider: 'cloudinary',
            document: savedDoc,
            antivirus_scan: 'clean',
        };
    }
    async getPresignedDownloadUrl(tenantId, id) {
        const doc = await this.getDocumentById(tenantId, id);
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'leadsphere-vault';
        const downloadUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/v${Date.now()}/${doc.s3_key}`;
        return {
            download_url: downloadUrl,
            provider: 'cloudinary',
            file_name: doc.file_name,
            mime_type: doc.mime_type,
            expires_in: 900,
        };
    }
    async uploadNewVersion(tenantId, id, userId, fileName, fileSize, changeSummary) {
        const doc = await this.getDocumentById(tenantId, id);
        const nextVersion = doc.current_version + 1;
        const s3Key = `tenants/${tenantId}/documents/${Date.now()}_v${nextVersion}_${fileName}`;
        doc.current_version = nextVersion;
        doc.file_name = fileName;
        doc.file_size = fileSize;
        doc.s3_key = s3Key;
        await this.documentRepo.save(doc);
        const version = this.versionRepo.create({
            tenant_id: tenantId,
            document_id: doc.id,
            version: nextVersion,
            file_name: fileName,
            file_size: fileSize,
            s3_key: s3Key,
            change_summary: changeSummary || `Uploaded version ${nextVersion}`,
            uploaded_by_user_id: userId,
        });
        await this.versionRepo.save(version);
        return this.getDocumentById(tenantId, id);
    }
    async deleteDocument(tenantId, id) {
        const doc = await this.getDocumentById(tenantId, id);
        await this.documentRepo.remove(doc);
        return { success: true, message: `Document ${id} deleted successfully.` };
    }
    async seedDefaultDocuments(tenantId) {
        const sampleDocsData = [
            {
                folder: 'Contracts',
                title: 'Master Services Agreement (MSA) - Enterprise Template',
                description: 'Standard enterprise MSA template with SLA guidelines and termination terms.',
                file_name: 'LeadSphere_MSA_2026_Template.pdf',
                file_size: 2450000,
                mime_type: 'application/pdf',
                s3_key: `tenants/${tenantId}/documents/msa_template.pdf`,
                current_version: 2,
            },
            {
                folder: 'Proposals',
                title: 'Q3 Enterprise Software Sales Proposal',
                description: 'Customized proposal deck for Apex Tech solution architecture.',
                file_name: 'ApexTech_Q3_Proposal_v2.pdf',
                file_size: 5800000,
                mime_type: 'application/pdf',
                s3_key: `tenants/${tenantId}/documents/q3_proposal.pdf`,
                current_version: 1,
            },
            {
                folder: 'NDA',
                title: 'Mutual Non-Disclosure Agreement',
                description: 'Bilateral confidentiality agreement pre-approved by legal.',
                file_name: 'Mutual_NDA_Standard_2026.docx',
                file_size: 450000,
                mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                s3_key: `tenants/${tenantId}/documents/mutual_nda.docx`,
                current_version: 1,
            },
            {
                folder: 'General',
                title: 'LeadSphere Product Security & Compliance Overview',
                description: 'Whitepaper detailing RLS isolation, SOC2 compliance, and encryption standards.',
                file_name: 'LeadSphere_Security_Whitepaper.pdf',
                file_size: 1200000,
                mime_type: 'application/pdf',
                s3_key: `tenants/${tenantId}/documents/security_whitepaper.pdf`,
                current_version: 1,
            },
        ];
        const seeded = [];
        for (const d of sampleDocsData) {
            const doc = this.documentRepo.create({
                tenant_id: tenantId,
                ...d,
                status: 'clean',
            });
            const saved = await this.documentRepo.save(doc);
            const v1 = this.versionRepo.create({
                tenant_id: tenantId,
                document_id: saved.id,
                version: 1,
                file_name: d.file_name,
                file_size: d.file_size,
                s3_key: d.s3_key,
                change_summary: 'Initial document upload',
            });
            await this.versionRepo.save(v1);
            if (d.current_version > 1) {
                const v2 = this.versionRepo.create({
                    tenant_id: tenantId,
                    document_id: saved.id,
                    version: 2,
                    file_name: d.file_name,
                    file_size: d.file_size + 15000,
                    s3_key: d.s3_key + '_v2',
                    change_summary: 'Updated terms and clause 4.2',
                });
                await this.versionRepo.save(v2);
            }
            seeded.push(saved);
        }
        return this.documentRepo.find({
            where: { tenant_id: tenantId },
            relations: ['versions'],
            order: { updated_at: 'DESC' },
        });
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_entity_1.Document)),
    __param(1, (0, typeorm_1.InjectRepository)(document_version_entity_1.DocumentVersion)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DocumentService);
//# sourceMappingURL=document.service.js.map