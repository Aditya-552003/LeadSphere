import { Controller, Get, Post, Body, Param, Res, UseGuards, Header, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImportExportService } from '../services/import-export.service';
import { DoclingParserService } from '../services/docling-parser.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Controller('data')
@UseGuards(JwtAuthGuard)
export class ImportExportController {
  constructor(
    private readonly importExportService: ImportExportService,
    private readonly doclingParserService: DoclingParserService,
  ) {}

  @Post('imports/pdf-docling')
  @RequirePermission('leads.create')
  @UseInterceptors(FileInterceptor('file'))
  async parsePdfWithDocling(@UploadedFile() file: any) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Please upload a valid PDF file');
    }
    const result = await this.doclingParserService.parsePdfDocument(file.buffer, file.originalname || 'document.pdf');
    return { data: result };
  }

  @Post('imports/commit-pdf')
  @RequirePermission('leads.create')
  async commitPdfImport(
    @TenantContext() ctx: ITenantContext,
    @Body()
    body: {
      filename: string;
      headers: string[];
      rows: string[][];
      columnMapping: Record<string, string>;
      deduplicationMode?: 'skip' | 'overwrite' | 'create';
    },
  ) {
    const job = await this.importExportService.processDoclingPdfImport(
      ctx.tenantId,
      ctx.userId,
      body.filename || 'import.pdf',
      body.headers || [],
      body.rows || [],
      body.columnMapping || {},
      body.deduplicationMode || 'skip',
    );
    return { data: job };
  }

  @Post('imports/auto-map')
  @RequirePermission('leads.create')
  async autoMap(@Body('headers') headers: string[]) {
    const mapping = this.importExportService.autoDetectMapping(headers || []);
    return { data: mapping };
  }

  @Post('imports/gemini-extract')
  @RequirePermission('leads.create')
  async geminiExtract(
    @Body()
    body: {
      fileType: 'pdf' | 'excel';
      rawContent?: string;
      headers?: string[];
      rows?: any[][];
    },
  ) {
    const leads = await this.importExportService.extractLeadsWithGemini(
      body.fileType || 'excel',
      body.rawContent || '',
      body.headers,
      body.rows,
    );
    return { data: leads };
  }

  @Post('imports/detect-duplicates')
  @RequirePermission('leads.create')
  async detectDuplicates(
    @TenantContext() ctx: ITenantContext,
    @Body('records') records: Array<{ email?: string; phone?: string }>,
  ) {
    const result = await this.importExportService.detectDuplicates(ctx.tenantId, records || []);
    return { data: result };
  }

  @Post('imports/commit-bulk')
  @RequirePermission('leads.create')
  async commitBulk(
    @TenantContext() ctx: ITenantContext,
    @Body()
    body: {
      filename: string;
      leads: any[];
      deduplicationMode?: 'skip' | 'overwrite' | 'create';
    },
  ) {
    const result = await this.importExportService.commitBulkLeads(
      ctx.tenantId,
      ctx.userId,
      body.filename || 'bulk_import.xlsx',
      body.leads || [],
      body.deduplicationMode || 'skip',
    );
    return { data: result };
  }

  @Post('imports')
  @RequirePermission('leads.create')
  async processImport(
    @TenantContext() ctx: ITenantContext,
    @Body()
    body: {
      filename: string;
      csvContent: string;
      columnMapping: Record<string, string>;
      deduplicationMode?: 'skip' | 'overwrite' | 'create';
    },
  ) {
    const job = await this.importExportService.processCsvImport(
      ctx.tenantId,
      ctx.userId,
      body.filename || 'import.csv',
      body.csvContent || '',
      body.columnMapping || {},
      body.deduplicationMode || 'skip',
    );
    return { data: job };
  }

  @Get('imports')
  @RequirePermission('leads.view')
  async getImports(@TenantContext() ctx: ITenantContext) {
    const jobs = await this.importExportService.getImportJobs(ctx.tenantId);
    return { data: jobs };
  }

  @Get('imports/:id/error-report')
  @RequirePermission('leads.view')
  async downloadErrorReport(
    @TenantContext() ctx: ITenantContext,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const csv = await this.importExportService.getImportErrorReportCsv(ctx.tenantId, id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="import_errors_${id}.csv"`);
    res.send(csv);
  }

  @Post('exports')
  @RequirePermission('leads.view')
  async processExport(@TenantContext() ctx: ITenantContext, @Res() res: Response) {
    const { job, csv } = await this.importExportService.processCsvExport(ctx.tenantId, ctx.userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leadsphere_export_${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('exports')
  @RequirePermission('leads.view')
  async getExports(@TenantContext() ctx: ITenantContext) {
    const jobs = await this.importExportService.getExportJobs(ctx.tenantId);
    return { data: jobs };
  }
}
