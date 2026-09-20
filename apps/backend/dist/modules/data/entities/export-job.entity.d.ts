export declare enum ExportStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class ExportJob {
    id: string;
    tenant_id: string;
    created_by: string;
    format: string;
    total_records: number;
    status: ExportStatus;
    file_url: string;
    created_at: Date;
    updated_at: Date;
}
