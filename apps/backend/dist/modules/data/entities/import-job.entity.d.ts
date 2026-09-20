export declare enum ImportStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class ImportJob {
    id: string;
    tenant_id: string;
    created_by: string;
    filename: string;
    total_rows: number;
    processed_rows: number;
    successful_rows: number;
    failed_rows: number;
    duplicate_rows: number;
    status: ImportStatus;
    column_mapping: Record<string, string>;
    error_log: Array<{
        row: number;
        email?: string;
        reason: string;
    }>;
    created_at: Date;
    updated_at: Date;
}
