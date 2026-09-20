import { Repository } from 'typeorm';
import { Followup, FollowupPriority, FollowupRecurrence } from '../entities/followup.entity';
import { LeadActivity } from '../../lead/entities/lead-activity.entity';
export declare class FollowupService {
    private readonly followupRepository;
    private readonly activityRepository;
    constructor(followupRepository: Repository<Followup>, activityRepository: Repository<LeadActivity>);
    create(tenantId: string, userId: string, dto: {
        title: string;
        notes?: string;
        lead_id?: string;
        due_at: string;
        timezone?: string;
        priority?: FollowupPriority;
        recurrence?: FollowupRecurrence;
    }): Promise<Followup>;
    findAll(tenantId: string, filterType?: 'overdue' | 'today' | 'upcoming' | 'completed' | 'all'): Promise<Followup[]>;
    getCalendarEvents(tenantId: string, startStr?: string, endStr?: string): Promise<Followup[]>;
    markCompleted(tenantId: string, userId: string, id: string): Promise<Followup>;
    snooze(tenantId: string, id: string, snoozeHours?: number): Promise<Followup>;
    remove(tenantId: string, id: string): Promise<Followup>;
}
