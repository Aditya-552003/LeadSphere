import { Repository } from 'typeorm';
import { AiRequest } from '../entities/ai-request.entity';
import { Lead } from '../../lead/entities/lead.entity';
import { LeadActivity } from '../../lead/entities/lead-activity.entity';
export declare class AiService {
    private readonly aiRequestRepository;
    private readonly leadRepository;
    private readonly activityRepository;
    constructor(aiRequestRepository: Repository<AiRequest>, leadRepository: Repository<Lead>, activityRepository: Repository<LeadActivity>);
    sanitizeInput(text?: string): string;
    summarizeLead(tenantId: string, userId: string, leadId: string): Promise<{
        lead_id: string;
        summary: string[];
        disclaimer: string;
    }>;
    draftOutreachEmail(tenantId: string, userId: string, leadId: string, tone?: 'professional' | 'persuasive' | 'casual'): Promise<{
        subject: string;
        body: string;
        tone: "professional" | "persuasive" | "casual";
        disclaimer: string;
    }>;
    classifySentiment(tenantId: string, userId: string, replyText: string): Promise<{
        sentiment: string;
        intent: string;
        recommended_action: string;
        disclaimer: string;
    }>;
    private logUsage;
}
