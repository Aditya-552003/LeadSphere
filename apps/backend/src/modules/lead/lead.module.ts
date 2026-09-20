import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { CustomField } from './entities/custom-field.entity';
import { Tag } from './entities/tag.entity';
import { LeadTag } from './entities/lead-tag.entity';
import { LeadNote } from './entities/lead-note.entity';
import { LeadActivity } from './entities/lead-activity.entity';
import { LeadService } from './services/lead.service';
import { LeadController } from './controllers/lead.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, CustomField, Tag, LeadTag, LeadNote, LeadActivity]),
    AuditModule,
  ],
  controllers: [LeadController],
  providers: [LeadService],
  exports: [LeadService],
})
export class LeadModule {}
