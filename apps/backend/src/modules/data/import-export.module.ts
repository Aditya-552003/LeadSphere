import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportJob } from './entities/import-job.entity';
import { ExportJob } from './entities/export-job.entity';
import { Lead } from '../lead/entities/lead.entity';
import { LeadActivity } from '../lead/entities/lead-activity.entity';
import { ImportExportService } from './services/import-export.service';
import { DoclingParserService } from './services/docling-parser.service';
import { ImportExportController } from './controllers/import-export.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ImportJob, ExportJob, Lead, LeadActivity])],
  controllers: [ImportExportController],
  providers: [ImportExportService, DoclingParserService],
  exports: [ImportExportService, DoclingParserService],
})
export class ImportExportModule {}
