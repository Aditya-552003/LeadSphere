import { AiService } from '../services/ai.service';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    summarizeLead(ctx: ITenantContext, leadId: string): Promise<{
        data: {
            lead_id: string;
            summary: string[];
            disclaimer: string;
        };
    }>;
    draftEmail(ctx: ITenantContext, body: {
        leadId: string;
        tone?: 'professional' | 'persuasive' | 'casual';
    }): Promise<{
        data: {
            subject: string;
            body: string;
            tone: "professional" | "persuasive" | "casual";
            disclaimer: string;
        };
    }>;
    classifySentiment(ctx: ITenantContext, text: string): Promise<{
        data: {
            sentiment: string;
            intent: string;
            recommended_action: string;
            disclaimer: string;
        };
    }>;
}
