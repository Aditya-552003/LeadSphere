import { Repository } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { CustomField } from '../entities/custom-field.entity';
import { Tag } from '../entities/tag.entity';
import { LeadTag } from '../entities/lead-tag.entity';
import { LeadNote } from '../entities/lead-note.entity';
import { LeadActivity } from '../entities/lead-activity.entity';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { AuditService } from '../../audit/services/audit.service';
export declare class LeadService {
    private readonly leadRepository;
    private readonly customFieldRepository;
    private readonly tagRepository;
    private readonly leadTagRepository;
    private readonly leadNoteRepository;
    private readonly leadActivityRepository;
    private readonly auditService;
    constructor(leadRepository: Repository<Lead>, customFieldRepository: Repository<CustomField>, tagRepository: Repository<Tag>, leadTagRepository: Repository<LeadTag>, leadNoteRepository: Repository<LeadNote>, leadActivityRepository: Repository<LeadActivity>, auditService: AuditService);
    findAll(tenantId: string, q?: string, limit?: number, cursor?: string): Promise<{
        data: Lead[];
        page: {
            next_cursor: string;
            has_more: boolean;
            total_estimate: number;
        };
    }>;
    findOne(tenantId: string, id: string): Promise<Lead>;
    create(tenantId: string, actorId: string, dto: CreateLeadDto): Promise<Lead>;
    update(tenantId: string, actorId: string, id: string, dto: UpdateLeadDto): Promise<Lead>;
    remove(tenantId: string, actorId: string, id: string): Promise<{
        message: string;
    }>;
    getTimeline(tenantId: string, leadId: string): Promise<LeadActivity[]>;
    addNote(tenantId: string, leadId: string, authorMembershipId: string, body: string): Promise<LeadNote>;
    private logActivity;
    private calculateRuleBasedScore;
    private validateCustomFields;
}
