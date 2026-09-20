import { Response } from 'express';
import { ImportExportService } from '../services/import-export.service';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';
export declare class ImportExportController {
    private readonly importExportService;
    constructor(importExportService: ImportExportService);
    autoMap(headers: string[]): Promise<{
        data: Record<string, string>;
    }>;
    processImport(ctx: ITenantContext, body: {
        filename: string;
        csvContent: string;
        columnMapping: Record<string, string>;
        deduplicationMode?: 'skip' | 'overwrite' | 'create';
    }): Promise<{
        data: import("../entities/import-job.entity").ImportJob;
    }>;
    getImports(ctx: ITenantContext): Promise<{
        data: import("../entities/import-job.entity").ImportJob[];
    }>;
    downloadErrorReport(ctx: ITenantContext, id: string, res: Response): Promise<void>;
    processExport(ctx: ITenantContext, res: Response): Promise<void>;
    getExports(ctx: ITenantContext): Promise<{
        data: import("../entities/export-job.entity").ExportJob[];
    }>;
}
