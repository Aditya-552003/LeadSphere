import { Campaign } from './campaign.entity';
import { EmailTemplate } from './email-template.entity';
export declare enum CampaignStepType {
    SEND_EMAIL = "send_email",
    WAIT_DAYS = "wait_days"
}
export declare class CampaignStep {
    id: string;
    campaign_id: string;
    campaign: Campaign;
    step_order: number;
    step_type: CampaignStepType;
    template_id: string;
    template?: EmailTemplate;
    wait_days: number;
    subject_override: string;
    created_at: Date;
}
