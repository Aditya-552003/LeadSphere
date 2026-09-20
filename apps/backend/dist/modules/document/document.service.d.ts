import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentVersion } from './entities/document-version.entity';
export declare class DocumentService {
    private readonly documentRepo;
    private readonly versionRepo;
    constructor(documentRepo: Repository<Document>, versionRepo: Repository<DocumentVersion>);
    getDocuments(tenantId: string, folder?: string): Promise<Document[]>;
    getDocumentById(tenantId: string, id: string): Promise<Document>;
    getPresignedUploadUrl(tenantId: string, title: string, fileName: string, mimeType: string, fileSize: number, folder?: string, description?: string, userId?: string): Promise<{
        upload_url: string;
        provider: string;
        document: Document;
        antivirus_scan: string;
    }>;
    getPresignedDownloadUrl(tenantId: string, id: string): Promise<{
        download_url: string;
        provider: string;
        file_name: string;
        mime_type: string;
        expires_in: number;
    }>;
    uploadNewVersion(tenantId: string, id: string, userId: string, fileName: string, fileSize: number, changeSummary?: string): Promise<Document>;
    deleteDocument(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private seedDefaultDocuments;
}
