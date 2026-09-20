import { LeadService } from '../services/lead.service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';
export declare class LeadController {
    private readonly leadService;
    constructor(leadService: LeadService);
    findAll(ctx: ITenantContext, q?: string, limit?: number, cursor?: string): Promise<{
        data: import("../entities/lead.entity").Lead[];
        page: {
            next_cursor: string;
            has_more: boolean;
            total_estimate: number;
        };
    }>;
    findOne(ctx: ITenantContext, id: string): Promise<{
        data: import("../entities/lead.entity").Lead;
    }>;
    create(ctx: ITenantContext, dto: CreateLeadDto): Promise<{
        data: import("../entities/lead.entity").Lead;
    }>;
    update(ctx: ITenantContext, id: string, dto: UpdateLeadDto): Promise<{
        data: import("../entities/lead.entity").Lead;
    }>;
    remove(ctx: ITenantContext, id: string): Promise<{
        data: {
            message: string;
        };
    }>;
    getTimeline(ctx: ITenantContext, id: string): Promise<{
        data: import("../entities/lead-activity.entity").LeadActivity[];
    }>;
    addNote(ctx: ITenantContext, id: string, body: string): Promise<{
        data: import("../entities/lead-note.entity").LeadNote;
    }>;
}
