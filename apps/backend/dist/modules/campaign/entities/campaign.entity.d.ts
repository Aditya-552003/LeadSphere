import { CampaignStep } from './campaign-step.entity';
import { CampaignMember } from './campaign-member.entity';
export declare enum CampaignStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    PAUSED = "paused",
    COMPLETED = "completed"
}
export declare class Campaign {
    id: string;
    tenant_id: string;
    created_by: string;
    name: string;
    status: CampaignStatus;
    sender_email: string;
    total_enrolled: number;
    delivered_count: number;
    opened_count: number;
    replied_count: number;
    stop_on_reply: boolean;
    stop_on_stage_change: boolean;
    steps: CampaignStep[];
    members: CampaignMember[];
    created_at: Date;
    updated_at: Date;
}
