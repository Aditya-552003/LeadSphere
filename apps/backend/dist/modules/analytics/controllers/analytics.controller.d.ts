import { AnalyticsService } from '../services/analytics.service';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getOverview(ctx: ITenantContext): Promise<{
        data: {
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
        };
    }>;
}
