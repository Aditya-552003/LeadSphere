import { Controller, Get, Post, Body, Param, Res, UseGuards, Header } from '@nestjs/common';
import { Response } from 'express';
import { ImportExportService } from '../services/import-export.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Controller('data')
@UseGuards(JwtAuthGuard)
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Post('imports/auto-map')
  @RequirePermission('leads.create')
  async autoMap(@Body('headers') headers: string[]) {
    const mapping = this.importExportService.autoDetectMapping(headers || []);
    return { data: mapping };
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
