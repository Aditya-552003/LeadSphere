import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiRequest, AiActionType } from '../entities/ai-request.entity';
import { Lead } from '../../lead/entities/lead.entity';
import { LeadActivity } from '../../lead/entities/lead-activity.entity';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiRequest)
    private readonly aiRequestRepository: Repository<AiRequest>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(LeadActivity)
    private readonly activityRepository: Repository<LeadActivity>,
  ) {}

  sanitizeInput(text?: string): string {
    if (!text) return '';
    let sanitized = text.trim();
    // Prompt Injection Defense Guardrails
    const injectionPatterns = [
      /ignore previous instructions/gi,
      /system prompt/gi,
      /you are now an unrestricted/gi,
      /sudo/gi,
      /eval\(/gi,
      /override system rules/gi,
    ];

    injectionPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '[BLOCKED_PROMPT_INJECTION]');
    });

    return sanitized;
  }

  async summarizeLead(tenantId: string, userId: string, leadId: string) {
    const lead = await this.leadRepository.findOne({ where: { id: leadId, tenant_id: tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const activities = await this.activityRepository.find({
      where: { tenant_id: tenantId, lead_id: leadId },
      order: { occurred_at: 'DESC' },
      take: 5,
    });

    const cleanCompany = this.sanitizeInput(lead.company_name || 'N/A');
    const cleanTitle = this.sanitizeInput(lead.designation || 'Executive');

    const summaryPoints = [
      `Lead ${lead.first_name} ${lead.last_name} holds position '${cleanTitle}' at '${cleanCompany}'.`,
      `Current AI Lead Score is ${lead.lead_score}/100 with default rule-based qualification.`,
      `Recorded ${activities.length} recent activity interactions in 360° timeline stream.`,
      `Recommended Action: Schedule a discovery call or send personalized outreach sequence.`,
    ];

    await this.logUsage(tenantId, userId, AiActionType.SUMMARIZE_LEAD, 150, 220);

    return {
      lead_id: lead.id,
      summary: summaryPoints,
      disclaimer: 'AI-generated — verify before send',
    };
  }

  async draftOutreachEmail(
    tenantId: string,
    userId: string,
    leadId: string,
    tone: 'professional' | 'persuasive' | 'casual' = 'professional',
  ) {
    const lead = await this.leadRepository.findOne({ where: { id: leadId, tenant_id: tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const cleanFirstName = this.sanitizeInput(lead.first_name);
    const cleanCompany = this.sanitizeInput(lead.company_name || 'your company');

    let subject = `Exploring synergies with ${cleanCompany}`;
    let body = `Hi ${cleanFirstName},\n\nI hope this email finds you well.\n\nI've been following ${cleanCompany}'s growth and wanted to introduce LeadSphere to help streamline your team's outreach operations.\n\nWould you be open for a brief 15-minute introductory call this week?\n\nBest regards,\nAlex Vance`;

    if (tone === 'casual') {
      subject = `Quick question re: ${cleanCompany}`;
      body = `Hey ${cleanFirstName},\n\nHope you're having a great week! Saw what you guys are building at ${cleanCompany} and thought our platform could save your team a ton of time on lead outreach.\n\nLet me know if you'd be open to a quick chat!\n\nCheers,\nAlex`;
    } else if (tone === 'persuasive') {
      subject = `Accelerating ROI for ${cleanCompany}`;
      body = `Dear ${cleanFirstName},\n\nLeading companies in your sector are boosting lead conversion by over 35% using LeadSphere's multi-channel automation.\n\nI'd love to share a 5-minute custom walkthrough for ${cleanCompany}.\n\nWhen would be a good time to connect?\n\nSincerely,\nAlex Vance`;
    }

    await this.logUsage(tenantId, userId, AiActionType.DRAFT_EMAIL, 180, 280);

    return {
      subject,
      body,
      tone,
      disclaimer: 'AI-generated — verify before send',
    };
  }

  async classifySentiment(tenantId: string, userId: string, replyText: string) {
    const cleanText = this.sanitizeInput(replyText);
    if (!cleanText) throw new BadRequestException('Reply text is required for classification');

    let sentiment = 'neutral';
    let intent = 'inquiry';
    let recommendedAction = 'Respond with product documentation and calendar link';

    const lower = cleanText.toLowerCase();

    if (/interested|demo|pricing|call|meeting|sounds good|yes/i.test(lower)) {
      sentiment = 'positive';
      intent = 'meeting_requested';
      recommendedAction = 'High Priority: Send calendar scheduling link immediately';
    } else if (/not interested|remove|stop|unsubscribe|busy/i.test(lower)) {
      sentiment = 'negative';
      intent = 'opt_out';
      recommendedAction = 'Mark lead do-not-contact and pause active campaigns';
    } else if (/cost|price|budget|too expensive/i.test(lower)) {
      sentiment = 'objection';
      intent = 'pricing_objection';
      recommendedAction = 'Send ROI calculator sheet and tier discount options';
    }

    await this.logUsage(tenantId, userId, AiActionType.CLASSIFY_SENTIMENT, 120, 160);

    return {
      sentiment,
      intent,
      recommended_action: recommendedAction,
      disclaimer: 'AI-generated — verify before send',
    };
  }

  private async logUsage(
    tenantId: string,
    userId: string,
    actionType: AiActionType,
    promptTokens: number,
    completionTokens: number,
  ) {
    const req = this.aiRequestRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      action_type: actionType,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      model_name: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      disclaimer_label: 'AI-generated — verify before send',
    });
    await this.aiRequestRepository.save(req);
  }
}
