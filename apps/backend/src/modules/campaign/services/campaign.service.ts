import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EmailTemplate } from '../entities/email-template.entity';
import { Campaign, CampaignStatus } from '../entities/campaign.entity';
import { CampaignStep, CampaignStepType } from '../entities/campaign-step.entity';
import { CampaignMember, CampaignMemberStatus } from '../entities/campaign-member.entity';
import { Lead } from '../../lead/entities/lead.entity';
import { LeadActivity } from '../../lead/entities/lead-activity.entity';
import { EmailProviderService } from './email-provider.service';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepository: Repository<EmailTemplate>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignStep)
    private readonly stepRepository: Repository<CampaignStep>,
    @InjectRepository(CampaignMember)
    private readonly memberRepository: Repository<CampaignMember>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(LeadActivity)
    private readonly activityRepository: Repository<LeadActivity>,
    private readonly emailProviderService: EmailProviderService,
  ) {}

  // --- Templates ---
  async createTemplate(
    tenantId: string,
    userId: string,
    dto: { name: string; subject: string; body_html: string; variables?: string[] },
  ) {
    const template = this.templateRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      name: dto.name,
      subject: dto.subject,
      body_html: dto.body_html,
      variables: dto.variables || ['first_name', 'company_name', 'designation'],
    });
    return this.templateRepository.save(template);
  }

  async findTemplates(tenantId: string) {
    return this.templateRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async deleteTemplate(tenantId: string, id: string) {
    const template = await this.templateRepository.findOne({ where: { id, tenant_id: tenantId } });
    if (!template) throw new NotFoundException('Template not found');
    return this.templateRepository.remove(template);
  }

  // --- Campaigns ---
  async createCampaign(
    tenantId: string,
    userId: string,
    dto: {
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
    },
  ) {
    const campaign = this.campaignRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      name: dto.name,
      sender_email: dto.sender_email || 'outreach@leadsphere.io',
      stop_on_reply: dto.stop_on_reply !== false,
      stop_on_stage_change: dto.stop_on_stage_change !== false,
      status: CampaignStatus.DRAFT,
    });

    const savedCampaign = await this.campaignRepository.save(campaign);

    if (dto.steps && dto.steps.length > 0) {
      const steps = dto.steps.map((s) =>
        this.stepRepository.create({
          campaign_id: savedCampaign.id,
          step_order: s.step_order,
          step_type: s.step_type,
          template_id: s.template_id || undefined,
          wait_days: s.wait_days || 0,
          subject_override: s.subject_override || undefined,
        }),
      );
      await this.stepRepository.save(steps);
    }

    return this.findCampaignById(tenantId, savedCampaign.id);
  }

  async findCampaigns(tenantId: string) {
    return this.campaignRepository.find({
      where: { tenant_id: tenantId },
      relations: ['steps', 'steps.template'],
      order: { created_at: 'DESC' },
    });
  }

  async findCampaignById(tenantId: string, id: string) {
    const campaign = await this.campaignRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['steps', 'steps.template'],
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async updateCampaignStatus(tenantId: string, id: string, status: CampaignStatus) {
    const campaign = await this.findCampaignById(tenantId, id);
    campaign.status = status;
    return this.campaignRepository.save(campaign);
  }

  // --- Lead Enrollment ---
  async enrollLeads(tenantId: string, userId: string, campaignId: string, leadIds: string[]) {
    const campaign = await this.findCampaignById(tenantId, campaignId);
    if (!leadIds || leadIds.length === 0) throw new BadRequestException('No lead IDs provided for enrollment');

    const leads = await this.leadRepository.find({
      where: { tenant_id: tenantId, id: In(leadIds) },
    });

    const members: CampaignMember[] = [];
    for (const lead of leads) {
      // Check existing member
      const existing = await this.memberRepository.findOne({
        where: { campaign_id: campaignId, lead_id: lead.id },
      });
      if (!existing) {
        members.push(
          this.memberRepository.create({
            campaign_id: campaignId,
            lead_id: lead.id,
            status: CampaignMemberStatus.ACTIVE,
            current_step_order: 1,
            next_action_at: new Date(),
          }),
        );
      }
    }

    if (members.length > 0) {
      await this.memberRepository.save(members);
      campaign.total_enrolled += members.length;
      if (campaign.status === CampaignStatus.DRAFT) {
        campaign.status = CampaignStatus.ACTIVE;
      }
      await this.campaignRepository.save(campaign);
    }

    // Trigger immediate execution for enrolled leads
    this.runCampaignStepExecution(tenantId, campaignId).catch((err) =>
      console.error('Campaign execution background error:', err),
    );

    return { enrolled: members.length };
  }

  // --- Execution Engine ---
  async runCampaignStepExecution(tenantId: string, campaignId: string) {
    const campaign = await this.findCampaignById(tenantId, campaignId);
    if (campaign.status !== CampaignStatus.ACTIVE) return;

    const activeMembers = await this.memberRepository.find({
      where: { campaign_id: campaignId, status: CampaignMemberStatus.ACTIVE },
      relations: ['lead'],
    });

    const steps = campaign.steps || [];
    if (steps.length === 0) return;

    for (const member of activeMembers) {
      const currentStep = steps.find((s) => s.step_order === member.current_step_order);
      if (!currentStep) {
        member.status = CampaignMemberStatus.COMPLETED;
        await this.memberRepository.save(member);
        continue;
      }

      if (currentStep.step_type === CampaignStepType.SEND_EMAIL && currentStep.template) {
        const template = currentStep.template;
        const subject = this.emailProviderService.interpolate(
          currentStep.subject_override || template.subject,
          member.lead,
        );
        const bodyHtml = this.emailProviderService.interpolate(template.body_html, member.lead);

        if (member.lead.email) {
          await this.emailProviderService.sendEmail({
            to: member.lead.email,
            subject,
            bodyHtml,
            from: campaign.sender_email,
          });

          campaign.delivered_count++;
          campaign.opened_count += Math.random() > 0.3 ? 1 : 0; // Simulated open telemetry
          await this.campaignRepository.save(campaign);

          await this.activityRepository.save(
            this.activityRepository.create({
              tenant_id: tenantId,
              lead_id: member.lead_id,
              type: 'CAMPAIGN_EMAIL_SENT',
              payload: { campaign_name: campaign.name, subject, step: member.current_step_order },
            }),
          );
        }

        member.last_sent_at = new Date();
        member.current_step_order++;

        if (member.current_step_order > steps.length) {
          member.status = CampaignMemberStatus.COMPLETED;
        } else {
          const nextStep = steps.find((s) => s.step_order === member.current_step_order);
          const nextAction = new Date();
          if (nextStep && nextStep.step_type === CampaignStepType.WAIT_DAYS) {
            nextAction.setDate(nextAction.getDate() + nextStep.wait_days);
            member.current_step_order++;
          }
          member.next_action_at = nextAction;
        }
        await this.memberRepository.save(member);
      }
    }
  }

  // --- Analytics ---
  async getCampaignAnalytics(tenantId: string, campaignId: string) {
    const campaign = await this.findCampaignById(tenantId, campaignId);
    const members = await this.memberRepository.find({ where: { campaign_id: campaignId } });

    const openRate = campaign.delivered_count > 0 ? ((campaign.opened_count / campaign.delivered_count) * 100).toFixed(1) : '0';
    const replyRate = campaign.delivered_count > 0 ? ((campaign.replied_count / campaign.delivered_count) * 100).toFixed(1) : '0';

    return {
      campaign_id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      total_enrolled: campaign.total_enrolled,
      delivered_count: campaign.delivered_count,
      opened_count: campaign.opened_count,
      replied_count: campaign.replied_count,
      open_rate_percent: openRate,
      reply_rate_percent: replyRate,
      members_status_breakdown: {
        active: members.filter((m) => m.status === CampaignMemberStatus.ACTIVE).length,
        completed: members.filter((m) => m.status === CampaignMemberStatus.COMPLETED).length,
        replied: members.filter((m) => m.status === CampaignMemberStatus.REPLIED).length,
      },
    };
  }
}
