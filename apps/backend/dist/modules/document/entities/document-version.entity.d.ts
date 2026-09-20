import { Document } from './document.entity';
export declare class DocumentVersion {
    id: string;
    tenant_id: string;
    document_id: string;
    version: number;
    file_name: string;
    file_size: number;
    s3_key: string;
    change_summary: string;
    uploaded_by_user_id: string;
    created_at: Date;
    document: Document;
}
