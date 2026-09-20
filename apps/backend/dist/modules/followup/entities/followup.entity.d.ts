import { Lead } from '../../lead/entities/lead.entity';
export declare enum FollowupPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum FollowupStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    SNOOZED = "snoozed",
    CANCELLED = "cancelled"
}
export declare enum FollowupRecurrence {
    NONE = "none",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export declare class Followup {
    id: string;
    tenant_id: string;
    created_by: string;
    assigned_to: string;
    lead_id: string;
    lead?: Lead;
    title: string;
    notes: string;
    due_at: Date;
    timezone: string;
    priority: FollowupPriority;
    status: FollowupStatus;
    snoozed_until: Date;
    completed_at: Date;
    recurrence: FollowupRecurrence;
    created_at: Date;
    updated_at: Date;
}
