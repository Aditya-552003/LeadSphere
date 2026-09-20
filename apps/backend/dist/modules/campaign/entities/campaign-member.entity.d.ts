import { Campaign } from './campaign.entity';
import { Lead } from '../../lead/entities/lead.entity';
export declare enum CampaignMemberStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    COMPLETED = "completed",
    REPLIED = "replied",
    UNSUBSCRIBED = "unsubscribed"
}
export declare class CampaignMember {
    id: string;
    campaign_id: string;
    campaign: Campaign;
    lead_id: string;
    lead: Lead;
    status: CampaignMemberStatus;
    current_step_order: number;
    next_action_at: Date;
    last_sent_at: Date;
    created_at: Date;
    updated_at: Date;
}
