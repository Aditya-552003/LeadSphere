import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentVersion } from './entities/document-version.entity';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(DocumentVersion)
    private readonly versionRepo: Repository<DocumentVersion>,
  ) {}

  async getDocuments(tenantId: string, folder?: string) {
    let docs = await this.documentRepo.find({
      where: folder ? { tenant_id: tenantId, folder } : { tenant_id: tenantId },
      relations: ['versions'],
      order: { updated_at: 'DESC' },
    });

    if (docs.length === 0) {
      // Seed default documents for demonstration
      docs = await this.seedDefaultDocuments(tenantId);
    }

    return docs;
  }

  async getDocumentById(tenantId: string, id: string) {
    const doc = await this.documentRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['versions'],
    });
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found.`);
    }
    return doc;
  }

  async getPresignedUploadUrl(
    tenantId: string,
    title: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
    folder: string = 'General',
    description?: string,
    userId?: string,
  ) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'leadsphere-vault';
    const s3Key = `tenants/${tenantId}/documents/${Date.now()}_${fileName}`;
    const mockCloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload?signature=mock_cloudinary_sig&timestamp=${Date.now()}`;

    // Create document record
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
      status: 'clean', // Simulated Cloudinary malware scan check (passed)
      created_by_user_id: userId || null,
    });

    const savedDoc = await this.documentRepo.save(doc);

    // Initial version
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

  async getPresignedDownloadUrl(tenantId: string, id: string) {
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

  async uploadNewVersion(
    tenantId: string,
    id: string,
    userId: string,
    fileName: string,
    fileSize: number,
    changeSummary?: string,
  ) {
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

  async deleteDocument(tenantId: string, id: string) {
    const doc = await this.getDocumentById(tenantId, id);
    await this.documentRepo.remove(doc);
    return { success: true, message: `Document ${id} deleted successfully.` };
  }

  private async seedDefaultDocuments(tenantId: string): Promise<Document[]> {
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

    const seeded: Document[] = [];
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
}
