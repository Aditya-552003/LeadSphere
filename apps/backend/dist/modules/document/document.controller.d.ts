import { DocumentService } from './document.service';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    getDocuments(req: any, folder?: string): Promise<import("./entities/document.entity").Document[]>;
    getDocumentById(req: any, id: string): Promise<import("./entities/document.entity").Document>;
    getPresignedUploadUrl(req: any, body: {
        title: string;
        fileName: string;
        mimeType: string;
        fileSize: number;
        folder?: string;
        description?: string;
    }): Promise<{
        upload_url: string;
        provider: string;
        document: import("./entities/document.entity").Document;
        antivirus_scan: string;
    }>;
    getPresignedDownloadUrl(req: any, id: string): Promise<{
        download_url: string;
        provider: string;
        file_name: string;
        mime_type: string;
        expires_in: number;
    }>;
    uploadNewVersion(req: any, id: string, body: {
        fileName: string;
        fileSize: number;
        changeSummary?: string;
    }): Promise<import("./entities/document.entity").Document>;
    deleteDocument(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
