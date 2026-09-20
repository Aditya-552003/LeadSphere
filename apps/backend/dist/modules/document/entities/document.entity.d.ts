import { DocumentVersion } from './document-version.entity';
export declare class Document {
    id: string;
    tenant_id: string;
    folder: string;
    title: string;
    description: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    s3_key: string;
    current_version: number;
    status: string;
    created_by_user_id: string;
    created_at: Date;
    updated_at: Date;
    versions: DocumentVersion[];
}
