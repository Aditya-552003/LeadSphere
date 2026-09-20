import { CampaignService } from '../services/campaign.service';
import { CampaignStatus } from '../entities/campaign.entity';
import { CampaignStepType } from '../entities/campaign-step.entity';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';
export declare class CampaignController {
    private readonly campaignService;
    constructor(campaignService: CampaignService);
    findTemplates(ctx: ITenantContext): Promise<{
        data: import("../entities/email-template.entity").EmailTemplate[];
    }>;
    createTemplate(ctx: ITenantContext, body: {
        name: string;
        subject: string;
        body_html: string;
        variables?: string[];
    }): Promise<{
        data: import("../entities/email-template.entity").EmailTemplate;
    }>;
    deleteTemplate(ctx: ITenantContext, id: string): Promise<{
        data: import("../entities/email-template.entity").EmailTemplate;
    }>;
    findCampaigns(ctx: ITenantContext): Promise<{
        data: import("../entities/campaign.entity").Campaign[];
    }>;
    createCampaign(ctx: ITenantContext, body: {
        name: string;
        sender_email?: string;
        stop_on_reply?: boolean;
        stop_on_stage_change?: boolean;
        steps: Array<{
            step_order: number;
            step_type: CampaignStepType;
            template_id?: string;
            wait_days?: number;
            subject_override?: string;
        }>;
    }): Promise<{
        data: import("../entities/campaign.entity").Campaign;
    }>;
    findCampaignById(ctx: ITenantContext, id: string): Promise<{
        data: import("../entities/campaign.entity").Campaign;
    }>;
    updateStatus(ctx: ITenantContext, id: string, status: CampaignStatus): Promise<{
        data: import("../entities/campaign.entity").Campaign;
    }>;
    enrollLeads(ctx: ITenantContext, id: string, leadIds: string[]): Promise<{
        data: {
            enrolled: number;
        };
    }>;
    getAnalytics(ctx: ITenantContext, id: string): Promise<{
        data: {
            campaign_id: string;
            name: string;
            status: CampaignStatus;
            total_enrolled: number;
            delivered_count: number;
            opened_count: number;
            replied_count: number;
            open_rate_percent: string;
            reply_rate_percent: string;
            members_status_breakdown: {
                active: number;
                completed: number;
                replied: number;
            };
        };
    }>;
}
