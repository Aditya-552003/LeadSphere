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
    const text = buffer.toString('utf-8');
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

    let headers: string[] = [];
    let rows: string[][] = [];

    if (lines.length > 0) {
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t')
        ? '\t'
        : firstLine.includes(',')
        ? ','
        : firstLine.includes('|')
        ? '|'
        : null;

      if (delimiter) {
        headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
        lines.slice(1).forEach((line) => {
          const cols = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.some((c) => c.length > 0)) {
            rows.push(cols);
          }
        });
      } else {
        headers = ['Name', 'Email', 'Phone', 'Company', 'Designation', 'Estimated Value ($)'];
        lines.forEach((line) => {
          const cols = line.split(/\s{2,}/).map((c) => c.trim()).filter((c) => c.length > 0);
          if (cols.length > 0) {
            rows.push(cols);
          }
        });
      }
    }

    if (headers.length === 0) {
      headers = ['Column 1', 'Column 2', 'Column 3'];
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
