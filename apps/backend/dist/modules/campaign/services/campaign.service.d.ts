import { Repository } from 'typeorm';
import { EmailTemplate } from '../entities/email-template.entity';
import { Campaign, CampaignStatus } from '../entities/campaign.entity';
import { CampaignStep, CampaignStepType } from '../entities/campaign-step.entity';
import { CampaignMember } from '../entities/campaign-member.entity';
import { Lead } from '../../lead/entities/lead.entity';
import { LeadActivity } from '../../lead/entities/lead-activity.entity';
import { EmailProviderService } from './email-provider.service';
export declare class CampaignService {
    private readonly templateRepository;
    private readonly campaignRepository;
    private readonly stepRepository;
    private readonly memberRepository;
    private readonly leadRepository;
    private readonly activityRepository;
    private readonly emailProviderService;
    constructor(templateRepository: Repository<EmailTemplate>, campaignRepository: Repository<Campaign>, stepRepository: Repository<CampaignStep>, memberRepository: Repository<CampaignMember>, leadRepository: Repository<Lead>, activityRepository: Repository<LeadActivity>, emailProviderService: EmailProviderService);
    createTemplate(tenantId: string, userId: string, dto: {
        name: string;
        subject: string;
        body_html: string;
        variables?: string[];
    }): Promise<EmailTemplate>;
    findTemplates(tenantId: string): Promise<EmailTemplate[]>;
    deleteTemplate(tenantId: string, id: string): Promise<EmailTemplate>;
    createCampaign(tenantId: string, userId: string, dto: {
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
    }): Promise<Campaign>;
    findCampaigns(tenantId: string): Promise<Campaign[]>;
    findCampaignById(tenantId: string, id: string): Promise<Campaign>;
    updateCampaignStatus(tenantId: string, id: string, status: CampaignStatus): Promise<Campaign>;
    enrollLeads(tenantId: string, userId: string, campaignId: string, leadIds: string[]): Promise<{
        enrolled: number;
    }>;
    runCampaignStepExecution(tenantId: string, campaignId: string): Promise<void>;
    getCampaignAnalytics(tenantId: string, campaignId: string): Promise<{
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
    }>;
}
