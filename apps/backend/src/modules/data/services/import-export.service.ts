import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportJob, ImportStatus } from '../entities/import-job.entity';
import { ExportJob, ExportStatus } from '../entities/export-job.entity';
import { Lead } from '../../lead/entities/lead.entity';
import { LeadActivity } from '../../lead/entities/lead-activity.entity';

const HEADER_SYNONYMS: Record<string, string> = {
  'first_name': 'first_name',
  'firstname': 'first_name',
  'fname': 'first_name',
  'name': 'first_name',
  'full_name': 'first_name',
  'last_name': 'last_name',
  'lastname': 'last_name',
  'lname': 'last_name',
  'email': 'email',
  'e-mail': 'email',
  'mail': 'email',
  'email_address': 'email',
  'phone': 'phone',
  'phone_number': 'phone',
  'mobile': 'phone',
  'cell': 'phone',
  'company': 'company_name',
  'company_name': 'company_name',
  'organization': 'company_name',
  'org': 'company_name',
  'title': 'designation',
  'designation': 'designation',
  'job_title': 'designation',
  'position': 'designation',
  'estimated_value': 'estimated_value',
  'deal_value': 'estimated_value',
  'budget': 'estimated_value',
  'value': 'estimated_value',
};

@Injectable()
export class ImportExportService {
  constructor(
    @InjectRepository(ImportJob)
    private readonly importJobRepository: Repository<ImportJob>,
    @InjectRepository(ExportJob)
    private readonly exportJobRepository: Repository<ExportJob>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(LeadActivity)
    private readonly activityRepository: Repository<LeadActivity>,
  ) {}

  autoDetectMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};

    headers.forEach((header) => {
      const cleanHeader = header.trim().toLowerCase().replace(/[\s\-_]+/g, '_');
      if (HEADER_SYNONYMS[cleanHeader]) {
        mapping[header] = HEADER_SYNONYMS[cleanHeader];
      } else {
        mapping[header] = 'ignore';
      }
    });

    return mapping;
  }

  async processCsvImport(
    tenantId: string,
    userId: string,
    filename: string,
    csvContent: string,
    columnMapping: Record<string, string>,
    deduplicationMode: 'skip' | 'overwrite' | 'create' = 'skip',
  ) {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      throw new Error('CSV file is empty or missing data rows');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1);

    const importJob = this.importJobRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      filename,
      total_rows: rows.length,
      status: ImportStatus.PROCESSING,
      column_mapping: columnMapping,
      error_log: [],
    });
    await this.importJobRepository.save(importJob);

    let successCount = 0;
    let failCount = 0;
    let dupCount = 0;
    const errorLog: Array<{ row: number; email?: string; reason: string }> = [];

    // Fetch existing leads for deduplication
    const existingLeads = await this.leadRepository.find({
      where: { tenant_id: tenantId },
      select: ['id', 'email', 'phone'],
    });

    const emailMap = new Map<string, Lead>();
    const phoneMap = new Map<string, Lead>();

    existingLeads.forEach((l) => {
      if (l.email) emailMap.set(l.email.toLowerCase(), l);
      if (l.phone) phoneMap.set(l.phone.replace(/\D/g, ''), l);
    });

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // header is row 1
      const values = this.parseCsvRow(rows[i]);

      const record: Record<string, any> = {};
      headers.forEach((h, index) => {
        const targetField = columnMapping[h];
        if (targetField && targetField !== 'ignore') {
          record[targetField] = values[index] ? values[index].trim() : '';
        }
      });

      const email = record.email ? record.email.toLowerCase() : null;
      const phoneDigits = record.phone ? record.phone.replace(/\D/g, '') : null;

      if (!record.first_name && !email) {
        failCount++;
        errorLog.push({ row: rowNum, email: email || '', reason: 'Missing lead name and email' });
        continue;
      }

      // Check deduplication
      const existingByEmail = email ? emailMap.get(email) : null;
      const existingByPhone = phoneDigits ? phoneMap.get(phoneDigits) : null;
      const existingLead = existingByEmail || existingByPhone;

      if (existingLead) {
        if (deduplicationMode === 'skip') {
          dupCount++;
          errorLog.push({ row: rowNum, email: email || '', reason: 'Duplicate lead found (skipped)' });
          continue;
        } else if (deduplicationMode === 'overwrite') {
          // Overwrite existing lead
          existingLead.first_name = record.first_name || existingLead.first_name;
          existingLead.last_name = record.last_name || existingLead.last_name;
          existingLead.full_name = `${existingLead.first_name} ${existingLead.last_name}`.trim();
          existingLead.company_name = record.company_name || existingLead.company_name;
          existingLead.designation = record.designation || record.title || existingLead.designation;
          if (record.estimated_value) {
            existingLead.custom = { ...(existingLead.custom || {}), estimated_value: Number(record.estimated_value) };
          }
          await this.leadRepository.save(existingLead);

          await this.activityRepository.save(
            this.activityRepository.create({
              tenant_id: tenantId,
              lead_id: existingLead.id,
              actor_membership_id: userId,
              type: 'LEAD_UPDATED',
              payload: { description: `Lead updated via CSV import (${filename})` },
            }),
          );
          successCount++;
          continue;
        }
      }

      // Create new lead
      const firstName = record.first_name || 'Lead';
      const lastName = record.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();

      const newLead = this.leadRepository.create({
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email: email || undefined,
        email_normalized: email || undefined,
        phone: record.phone || undefined,
        phone_e164: record.phone ? record.phone.replace(/[^\d+]/g, '') : undefined,
        company_name: record.company_name || undefined,
        designation: record.designation || record.title || undefined,
        lead_score: 50,
        custom: { estimated_value: record.estimated_value ? Number(record.estimated_value) : 0 },
      });

      const saved = (await this.leadRepository.save(newLead)) as Lead;
      if (email) emailMap.set(email, saved);
      if (phoneDigits) phoneMap.set(phoneDigits, saved);

      await this.activityRepository.save(
        this.activityRepository.create({
          tenant_id: tenantId,
          lead_id: saved.id,
          actor_membership_id: userId,
          type: 'LEAD_IMPORTED',
          payload: { description: `Lead imported via CSV (${filename})` },
        }),
      );

      successCount++;
    }

    importJob.processed_rows = rows.length;
    importJob.successful_rows = successCount;
    importJob.failed_rows = failCount;
    importJob.duplicate_rows = dupCount;
    importJob.status = ImportStatus.COMPLETED;
    importJob.error_log = errorLog;

    await this.importJobRepository.save(importJob);

    return importJob;
  }

  async processDoclingPdfImport(
    tenantId: string,
    userId: string,
    filename: string,
    headers: string[],
    rows: string[][],
    columnMapping: Record<string, string>,
    deduplicationMode: 'skip' | 'overwrite' | 'create' = 'skip',
  ) {
    if (!rows || rows.length === 0) {
      throw new Error('PDF document contains no parsed lead rows');
    }

    const importJob = this.importJobRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      filename,
      total_rows: rows.length,
      status: ImportStatus.PROCESSING,
      column_mapping: columnMapping,
      parsing_engine: 'docling',
      error_log: [],
    });
    await this.importJobRepository.save(importJob);

    let successCount = 0;
    let failCount = 0;
    let dupCount = 0;
    const errorLog: Array<{ row: number; email?: string; reason: string }> = [];

    const existingLeads = await this.leadRepository.find({
      where: { tenant_id: tenantId },
      select: ['id', 'email', 'phone'],
    });

    const emailMap = new Map<string, Lead>();
    const phoneMap = new Map<string, Lead>();

    existingLeads.forEach((l) => {
      if (l.email) emailMap.set(l.email.toLowerCase(), l);
      if (l.phone) phoneMap.set(l.phone.replace(/\D/g, ''), l);
    });

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      const values = rows[i];

      const record: Record<string, any> = {};
      headers.forEach((h, index) => {
        const targetField = columnMapping[h];
        if (targetField && targetField !== 'ignore') {
          record[targetField] = values[index] ? values[index].trim() : '';
        }
      });

      const email = record.email ? record.email.toLowerCase() : null;
      const phoneDigits = record.phone ? record.phone.replace(/\D/g, '') : null;

      if (!record.first_name && !email) {
        failCount++;
        errorLog.push({ row: rowNum, email: email || '', reason: 'Missing lead name and email' });
        continue;
      }

      const existingByEmail = email ? emailMap.get(email) : null;
      const existingByPhone = phoneDigits ? phoneMap.get(phoneDigits) : null;
      const existingLead = existingByEmail || existingByPhone;

      if (existingLead) {
        if (deduplicationMode === 'skip') {
          dupCount++;
          errorLog.push({ row: rowNum, email: email || '', reason: 'Duplicate lead found (skipped)' });
          continue;
        } else if (deduplicationMode === 'overwrite') {
          existingLead.first_name = record.first_name || existingLead.first_name;
          existingLead.last_name = record.last_name || existingLead.last_name;
          existingLead.full_name = `${existingLead.first_name} ${existingLead.last_name}`.trim();
          existingLead.company_name = record.company_name || existingLead.company_name;
          existingLead.designation = record.designation || record.title || existingLead.designation;
          if (record.estimated_value) {
            existingLead.custom = { ...(existingLead.custom || {}), estimated_value: Number(record.estimated_value) };
          }
          await this.leadRepository.save(existingLead);

          await this.activityRepository.save(
            this.activityRepository.create({
              tenant_id: tenantId,
              lead_id: existingLead.id,
              actor_membership_id: userId,
              type: 'LEAD_UPDATED',
              payload: { description: `Lead updated via Docling PDF import (${filename})` },
            }),
          );
          successCount++;
          continue;
        }
      }

      const firstName = record.first_name || 'Lead';
      const lastName = record.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();

      const newLead = this.leadRepository.create({
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email: email || undefined,
        email_normalized: email || undefined,
        phone: record.phone || undefined,
        phone_e164: record.phone ? record.phone.replace(/[^\d+]/g, '') : undefined,
        company_name: record.company_name || undefined,
        designation: record.designation || record.title || undefined,
        lead_score: 80,
        custom: { estimated_value: record.estimated_value ? Number(record.estimated_value) : 0 },
      });

      const saved = (await this.leadRepository.save(newLead)) as Lead;
      if (email) emailMap.set(email, saved);
      if (phoneDigits) phoneMap.set(phoneDigits, saved);

      await this.activityRepository.save(
        this.activityRepository.create({
          tenant_id: tenantId,
          lead_id: saved.id,
          actor_membership_id: userId,
          type: 'LEAD_IMPORTED',
          payload: { description: `Lead imported via Docling PDF (${filename})` },
        }),
      );

      successCount++;
    }

    importJob.processed_rows = rows.length;
    importJob.successful_rows = successCount;
    importJob.failed_rows = failCount;
    importJob.duplicate_rows = dupCount;
    importJob.status = ImportStatus.COMPLETED;
    importJob.error_log = errorLog;

    await this.importJobRepository.save(importJob);
    return importJob;
  }

  async getImportJobs(tenantId: string) {
    return this.importJobRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async getImportErrorReportCsv(tenantId: string, jobId: string): Promise<string> {
    const job = await this.importJobRepository.findOne({ where: { id: jobId, tenant_id: tenantId } });
    if (!job) throw new NotFoundException('Import job not found');

    let csv = 'Row Number,Email,Failure Reason\n';
    (job.error_log || []).forEach((err) => {
      const sanitizedReason = (err.reason || '').replace(/"/g, '""');
      csv += `${err.row},"${err.email || ''}","${sanitizedReason}"\n`;
    });

    return csv;
  }

  async processCsvExport(tenantId: string, userId: string): Promise<{ job: ExportJob; csv: string }> {
    const leads = await this.leadRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });

    const exportJob = this.exportJobRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      format: 'csv',
      total_records: leads.length,
      status: ExportStatus.COMPLETED,
    });
    await this.exportJobRepository.save(exportJob);

    const headers = ['ID', 'First Name', 'Last Name', 'Company', 'Designation', 'Email', 'Phone', 'Score', 'Estimated Value ($)', 'Created At'];
    let csv = headers.join(',') + '\n';

    leads.forEach((l) => {
      const estimatedVal = l.custom?.estimated_value || 0;
      const row = [
        l.id,
        this.sanitizeCsvCell(l.first_name),
        this.sanitizeCsvCell(l.last_name),
        this.sanitizeCsvCell(l.company_name),
        this.sanitizeCsvCell(l.designation),
        this.sanitizeCsvCell(l.email),
        this.sanitizeCsvCell(l.phone),
        l.lead_score,
        estimatedVal,
        l.created_at ? new Date(l.created_at).toISOString() : '',
      ];
      csv += row.join(',') + '\n';
    });

    return { job: exportJob, csv };
  }

  async getExportJobs(tenantId: string) {
    return this.exportJobRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  private sanitizeCsvCell(value?: string | null): string {
    if (!value) return '""';
    let str = String(value).trim();
    // CSV Formula Injection Defense: Prefix formula characters with a single quote
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'` + str;
    }
    return `"${str.replace(/"/g, '""')}"`;
  }

  private parseCsvRow(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.replace(/^"|"$/g, ''));
    return values;
  }
}
