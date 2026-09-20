import { FollowupService } from '../services/followup.service';
import { FollowupPriority, FollowupRecurrence } from '../entities/followup.entity';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';
export declare class FollowupController {
    private readonly followupService;
    constructor(followupService: FollowupService);
    findAll(ctx: ITenantContext, filterType?: 'overdue' | 'today' | 'upcoming' | 'completed' | 'all'): Promise<{
        data: import("../entities/followup.entity").Followup[];
    }>;
    getCalendarEvents(ctx: ITenantContext, start?: string, end?: string): Promise<{
        data: import("../entities/followup.entity").Followup[];
    }>;
    create(ctx: ITenantContext, body: {
        title: string;
        notes?: string;
        lead_id?: string;
        due_at: string;
        timezone?: string;
        priority?: FollowupPriority;
        recurrence?: FollowupRecurrence;
    }): Promise<{
        data: import("../entities/followup.entity").Followup;
    }>;
    markCompleted(ctx: ITenantContext, id: string): Promise<{
        data: import("../entities/followup.entity").Followup;
    }>;
    snooze(ctx: ITenantContext, id: string, snoozeHours?: number): Promise<{
        data: import("../entities/followup.entity").Followup;
    }>;
    remove(ctx: ITenantContext, id: string): Promise<{
        data: import("../entities/followup.entity").Followup;
    }>;
}
