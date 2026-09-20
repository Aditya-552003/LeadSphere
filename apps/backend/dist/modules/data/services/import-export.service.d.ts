import { Repository } from 'typeorm';
import { ImportJob } from '../entities/import-job.entity';
import { ExportJob } from '../entities/export-job.entity';
import { Lead } from '../../lead/entities/lead.entity';
import { LeadActivity } from '../../lead/entities/lead-activity.entity';
export declare class ImportExportService {
    private readonly importJobRepository;
    private readonly exportJobRepository;
    private readonly leadRepository;
    private readonly activityRepository;
    constructor(importJobRepository: Repository<ImportJob>, exportJobRepository: Repository<ExportJob>, leadRepository: Repository<Lead>, activityRepository: Repository<LeadActivity>);
    autoDetectMapping(headers: string[]): Record<string, string>;
    processCsvImport(tenantId: string, userId: string, filename: string, csvContent: string, columnMapping: Record<string, string>, deduplicationMode?: 'skip' | 'overwrite' | 'create'): Promise<ImportJob>;
    getImportJobs(tenantId: string): Promise<ImportJob[]>;
    getImportErrorReportCsv(tenantId: string, jobId: string): Promise<string>;
    processCsvExport(tenantId: string, userId: string): Promise<{
        job: ExportJob;
        csv: string;
    }>;
    getExportJobs(tenantId: string): Promise<ExportJob[]>;
    private sanitizeCsvCell;
    private parseCsvRow;
}
