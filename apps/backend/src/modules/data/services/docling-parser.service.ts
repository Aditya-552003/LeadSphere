import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execFileAsync = promisify(execFile);

export interface DoclingTable {
  table_index: number;
  headers: string[];
  rows: string[][];
  row_count: number;
}

export interface DoclingParseResult {
  success: boolean;
  engine: string;
  page_count: number;
  markdown: string;
  tables: DoclingTable[];
  auto_mapping: Record<string, string>;
  filename: string;
}

const HEADER_MAP: Record<string, string> = {
  'first_name': 'first_name',
  'firstname': 'first_name',
  'fname': 'first_name',
  'name': 'first_name',
  'full_name': 'first_name',
  'name_/_contact': 'first_name',
  'last_name': 'last_name',
  'lastname': 'last_name',
  'email': 'email',
  'email_address': 'email',
  'phone': 'phone',
  'phone_number': 'phone',
  'mobile': 'phone',
  'company': 'company_name',
  'company_name': 'company_name',
  'organization': 'company_name',
  'title': 'designation',
  'designation': 'designation',
  'job_title': 'designation',
  'role': 'designation',
  'title_/_role': 'designation',
};

@Injectable()
export class DoclingParserService {
  private readonly logger = new Logger(DoclingParserService.name);

  async parsePdfDocument(buffer: Buffer, filename: string): Promise<DoclingParseResult> {
    const tempDir = path.join(process.cwd(), 'temp_pdf_uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPath = path.join(tempDir, `upload_${Date.now()}_${path.basename(filename)}`);
    fs.writeFileSync(tempPath, buffer);

    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'parse_pdf_docling.py');
      const { stdout } = await execFileAsync('python', [scriptPath, tempPath], {
        maxBuffer: 10 * 1024 * 1024,
      });

      const parsed = JSON.parse(stdout);
      if (parsed && parsed.success) {
        const primaryTable = parsed.tables && parsed.tables.length > 0 ? parsed.tables[0] : null;
        const autoMapping = primaryTable ? this.detectAutoMapping(primaryTable.headers) : {};

        return {
          ...parsed,
          auto_mapping: autoMapping,
          filename,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Docling python sidecar execution fallback triggered: ${err.message}`);
    } finally {
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (_) {}
      }
    }

    // Fallback parser if python is not installed or execution fails
    return this.fallbackDoclingParser(buffer, filename);
  }

  detectAutoMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    headers.forEach((h) => {
      const clean = h.trim().toLowerCase().replace(/[\s\-_]+/g, '_');
      if (HEADER_MAP[clean]) {
        mapping[h] = HEADER_MAP[clean];
      } else {
        mapping[h] = 'ignore';
      }
    });
    return mapping;
  }

  private fallbackDoclingParser(buffer: Buffer, filename: string): DoclingParseResult {
    let text = buffer.toString('utf-8');

    // Clean broken multiline email/phone splits
    text = text.replace(/([a-zA-Z0-9._-]+)\s*\r?\n\s*@\s*\r?\n?\s*([a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, '$1@$2');
    text = text.replace(/(\+?\d{8,12})\s*\r?\n\s*(\d{2,4})/g, '$1$2');

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const phoneRegex = /(\+?\d{10,13}|\+?\d{2,4}[-.\s]?\d{3,5}[-.\s]?\d{4,5})/;

    const headers = ['Full Name', 'Email', 'Phone', 'Company Name', 'Designation'];
    const rows: string[][] = [];

    const emailMatches = Array.from(text.matchAll(emailRegex));

    if (emailMatches.length > 0) {
      emailMatches.forEach((match, idx) => {
        const email = match[0];
        const startPos = match.index || 0;
        const endPos = idx + 1 < emailMatches.length ? (emailMatches[idx + 1].index || text.length) : text.length;
        const block = text.substring(startPos, endPos);

        const phoneMatch = block.match(phoneRegex);
        const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : '';

        const blockClean = block.replace(email, '').replace(phone, '');
        const tokens = blockClean.split(/\r?\n/).map((t) => t.trim().replace(/^\d+\s*/, '')).filter((t) => t.length > 1);

        let company = '';
        let name = '';
        let designation = '';

        tokens.forEach((t) => {
          const upper = t.toUpperCase();
          if (/LIMITED|LTD|PVT|PRIVATE|INDUSTRIES|ENTERPRISES|CO\.|MACHINERY|PRODUCTS|SOLVENT|FOOD|CORP/i.test(upper)) {
            company = t;
          } else if (!name && /^[A-Za-z\s.]{3,40}$/.test(t)) {
            name = t;
          } else if (!designation) {
            designation = t;
          }
        });

        if (!name && email) {
          name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        }

        rows.push([name || 'Lead Record', email, phone, company || 'Enterprise', designation || 'Contact']);
      });
    } else {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      lines.forEach((line) => {
        const parts = line.split(/[\t,|]|\s{2,}/).map((p) => p.trim()).filter(Boolean);
        if (parts.length > 0) {
          rows.push(parts);
        }
      });
    }

    const tables: DoclingTable[] = [
      {
        table_index: 1,
        headers,
        rows,
        row_count: rows.length,
      },
    ];

    return {
      success: true,
      engine: 'docling_js_fallback',
      page_count: 1,
      markdown: text,
      tables,
      auto_mapping: this.detectAutoMapping(headers),
      filename,
    };
  }
}
