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
  'surname': 'last_name',
  'email': 'email',
  'e-mail': 'email',
  'mail': 'email',
  'email_address': 'email',
  'contact_email': 'email',
  'phone': 'phone',
  'phone_number': 'phone',
  'mobile': 'phone',
  'cell': 'phone',
  'contact': 'phone',
  'company': 'company_name',
  'company_name': 'company_name',
  'organization': 'company_name',
  'org': 'company_name',
  'title': 'title',
  'designation': 'title',
  'job_title': 'title',
  'position': 'title',
  'role': 'title',
  'location': 'location',
  'city': 'location',
  'address': 'location',
  'place': 'location',
  'state': 'location',
  'country': 'location',
  'industry': 'industry',
  'category': 'industry',
  'sector': 'industry',
  'status': 'status',
  'stage': 'status',
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

    const headers = ['ID', 'First Name', 'Last Name', 'Company', 'Designation', 'Email', 'Phone', 'Score', 'Created At'];
    let csv = headers.join(',') + '\n';

    leads.forEach((l) => {
      const row = [
        l.id,
        this.sanitizeCsvCell(l.first_name),
        this.sanitizeCsvCell(l.last_name),
        this.sanitizeCsvCell(l.company_name),
        this.sanitizeCsvCell(l.designation),
        this.sanitizeCsvCell(l.email),
        this.sanitizeCsvCell(l.phone),
        l.lead_score,
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

  async detectDuplicates(
    tenantId: string,
    records: Array<{ email?: string; phone?: string }>,
  ): Promise<{ duplicateEmails: string[]; duplicatePhones: string[] }> {
    const existing = await this.leadRepository.find({
      where: { tenant_id: tenantId },
      select: ['email', 'phone'],
    });

    const existingEmails = new Set(
      existing.map((l) => l.email?.toLowerCase().trim()).filter(Boolean),
    );
    const existingPhones = new Set(
      existing.map((l) => l.phone?.replace(/[^\d+]/g, '')).filter(Boolean),
    );

    const duplicateEmails: string[] = [];
    const duplicatePhones: string[] = [];

    records.forEach((r) => {
      const emailClean = r.email?.toLowerCase().trim();
      const phoneClean = r.phone?.replace(/[^\d+]/g, '');

      if (emailClean && existingEmails.has(emailClean)) {
        duplicateEmails.push(emailClean);
      }
      if (phoneClean && existingPhones.has(phoneClean)) {
        duplicatePhones.push(phoneClean);
      }
    });

    return {
      duplicateEmails: Array.from(new Set(duplicateEmails)),
      duplicatePhones: Array.from(new Set(duplicatePhones)),
    };
  }

  async commitBulkLeads(
    tenantId: string,
    userId: string,
    filename: string,
    leadsData: any[],
    deduplicationMode: 'skip' | 'overwrite' | 'create' = 'skip',
  ) {
    const importJob = this.importJobRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      filename,
      total_rows: leadsData.length,
      status: ImportStatus.PROCESSING,
      column_mapping: {},
      error_log: [],
    });
    await this.importJobRepository.save(importJob);

    let successCount = 0;
    let failCount = 0;
    let dupCount = 0;
    const errorLog: Array<{ row: number; email?: string; reason: string }> = [];

    const existingLeads = await this.leadRepository.find({
      where: { tenant_id: tenantId },
    });
    const emailMap = new Map<string, Lead>();
    const phoneMap = new Map<string, Lead>();

    existingLeads.forEach((l) => {
      if (l.email) emailMap.set(l.email.toLowerCase().trim(), l);
      if (l.phone) phoneMap.set(l.phone.replace(/[^\d+]/g, ''), l);
    });

    const savedLeads: Lead[] = [];

    for (let i = 0; i < leadsData.length; i++) {
      const row = leadsData[i];
      const fullName = row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unnamed Lead';
      const nameParts = fullName.split(' ');
      const firstName = row.first_name || nameParts[0] || 'Lead';
      const lastName = row.last_name || nameParts.slice(1).join(' ') || '';
      const email = row.email ? row.email.toLowerCase().trim() : undefined;
      const phone = row.phone ? String(row.phone).trim() : undefined;
      const phoneE164 = phone ? phone.replace(/[^\d+]/g, '') : undefined;
      const companyName = row.company_name || row.company || undefined;
      const title = row.title || row.designation || undefined;
      const location = row.location || row.city || undefined;
      const industry = row.industry || undefined;
      const status = row.status || 'New';
      const custom = row.custom || {};

      let existingLead: Lead | undefined;
      if (email && emailMap.has(email)) existingLead = emailMap.get(email);
      else if (phoneE164 && phoneMap.has(phoneE164)) existingLead = phoneMap.get(phoneE164);

      if (existingLead) {
        dupCount++;
        if (deduplicationMode === 'skip') {
          continue;
        } else if (deduplicationMode === 'overwrite') {
          existingLead.first_name = firstName;
          existingLead.last_name = lastName;
          existingLead.full_name = fullName;
          if (companyName) existingLead.company_name = companyName;
          if (title) existingLead.designation = title;
          if (location) existingLead.location = location;
          if (industry) existingLead.industry = industry;
          existingLead.custom = { ...(existingLead.custom || {}), ...custom };

          const updated = await this.leadRepository.save(existingLead);
          savedLeads.push(updated);
          successCount++;
          continue;
        }
      }

      try {
        const lead = this.leadRepository.create({
          tenant_id: tenantId,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          company_name: companyName,
          designation: title,
          email,
          email_normalized: email,
          phone,
          phone_e164: phoneE164,
          location,
          industry,
          lead_score: 50,
          custom: { ...custom, location, industry },
        });

        const saved = await this.leadRepository.save(lead);
        if (email) emailMap.set(email, saved);
        if (phoneE164) phoneMap.set(phoneE164, saved);
        savedLeads.push(saved);
        successCount++;
      } catch (err: any) {
        failCount++;
        errorLog.push({ row: i + 1, email, reason: err.message || 'Validation error' });
      }
    }

    importJob.processed_rows = leadsData.length;
    importJob.successful_rows = successCount;
    importJob.failed_rows = failCount;
    importJob.duplicate_rows = dupCount;
    importJob.status = ImportStatus.COMPLETED;
    importJob.error_log = errorLog;

    await this.importJobRepository.save(importJob);

    return { importJob, savedLeads };
  }

  async extractLeadsWithGemini(
    fileType: 'pdf' | 'excel',
    rawContent: string,
    headers?: string[],
    rows?: any[][],
  ): Promise<Array<{
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_name: string;
    title: string;
    location: string;
    industry: string;
    status: string;
  }>> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    let contentToAnalyze = rawContent || '';
    if (!contentToAnalyze && headers && rows) {
      contentToAnalyze = `Headers: ${headers.join(', ')}\n` + rows.map((r) => r.join(', ')).join('\n');
    }

    if (apiKey && contentToAnalyze.trim().length > 0) {
      try {
        const prompt = `You are an expert Lead Extraction AI. Analyze the following raw ${fileType.toUpperCase()} content and extract all lead/contact records.
Return ONLY a valid JSON array of objects without markdown formatting or code blocks.
Each object must have the following string properties:
- full_name
- first_name
- last_name
- email
- phone
- company_name
- title
- location
- industry
- status (default "New")

Content:
${contentToAnalyze.substring(0, 15000)}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { response_mime_type: 'application/json' },
            }),
          },
        );

        if (response.ok) {
          const resData: any = await response.json();
          const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const cleanText = candidateText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.map((item) => ({
                full_name: item.full_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Lead Contact',
                first_name: item.first_name || item.full_name?.split(' ')[0] || 'Lead',
                last_name: item.last_name || item.full_name?.split(' ').slice(1).join(' ') || '',
                email: item.email || '',
                phone: item.phone || '',
                company_name: item.company_name || item.company || '',
                title: item.title || item.designation || '',
                location: item.location || item.city || '',
                industry: item.industry || 'Technology & SaaS',
                status: item.status || 'New',
              }));
            }
          }
        }
      } catch (err) {
        console.error('Gemini API extraction failed, using structural parser fallback:', err);
      }
    }

    // High-precision fallback when API key is unconfigured or network call is unreachable
    const extracted: any[] = [];
    if (rows && rows.length > 0 && headers && headers.length > 0) {
      const mapping = this.autoDetectMapping(headers);
      rows.forEach((r) => {
        const item: any = {
          full_name: '',
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          company_name: '',
          title: '',
          location: '',
          industry: 'Technology & SaaS',
          status: 'New',
        };
        headers.forEach((h, idx) => {
          const target = mapping[h];
          const val = String(r[idx] || '').trim();
          if (target && target !== 'ignore' && val) {
            item[target] = val;
          }
        });
        if (!item.full_name) {
          item.full_name = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Lead Contact';
        }
        if (!item.first_name && item.full_name) {
          const parts = item.full_name.split(' ');
          item.first_name = parts[0] || 'Lead';
          item.last_name = parts.slice(1).join(' ') || '';
        }
        extracted.push(item);
      });
    } else if (contentToAnalyze) {
      const lines = contentToAnalyze.split(/\r?\n/).filter((l) => l.trim());
      lines.forEach((line, idx) => {
        const emailMatch = line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
        const phoneMatch = line.match(/(\+?\d{10,13}|\+?\d{2,4}[-.\s]?\d{3,5}[-.\s]?\d{4,5})/);
        if (emailMatch || phoneMatch || idx < 20) {
          const email = emailMatch ? emailMatch[0] : '';
          const phone = phoneMatch ? phoneMatch[0] : '';
          const cleanLine = line.replace(email, '').replace(phone, '').trim();
          const parts = cleanLine.split(/,|\t|\|/).map((s) => s.trim()).filter(Boolean);
          const name = parts[0] || `Lead Contact ${idx + 1}`;
          extracted.push({
            full_name: name,
            first_name: name.split(' ')[0] || 'Lead',
            last_name: name.split(' ').slice(1).join(' ') || '',
            email,
            phone,
            company_name: parts[1] || 'Acme Corp',
            title: parts[2] || 'Executive',
            location: parts[3] || 'New York, NY',
            industry: 'Technology & SaaS',
            status: 'New',
          });
        }
      });
    }

    return extracted;
  }
}
