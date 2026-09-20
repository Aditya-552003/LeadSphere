import { Repository } from 'typeorm';
import { Lead } from '../../lead/entities/lead.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { Message } from '../../inbox/entities/message.entity';
import { AnalyticsDaily } from '../entities/analytics-daily.entity';
export declare class AnalyticsService {
    private readonly leadRepository;
    private readonly campaignRepository;
    private readonly messageRepository;
    private readonly analyticsRepository;
    constructor(leadRepository: Repository<Lead>, campaignRepository: Repository<Campaign>, messageRepository: Repository<Message>, analyticsRepository: Repository<AnalyticsDaily>);
    getExecutiveOverview(tenantId: string): Promise<{
        pipeline_summary: {
            total_leads: number;
            total_pipeline_value: number;
            conversion_rate_percent: string;
            outreach_messages_sent: number;
        };
        funnel: {
            stage: string;
            count: number;
            conversionPercent: number;
        }[];
        channel_breakdown: {
            email: {
                count: number;
                open_rate: string;
            };
            whatsapp: {
                count: number;
                open_rate: string;
            };
        };
        source_distribution: {
            source: string;
            count: number;
        }[];
        leaderboard: {
            name: string;
            deals_closed: number;
            revenue: string;
        }[];
    }>;
}
