"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const email_template_entity_1 = require("../entities/email-template.entity");
const campaign_entity_1 = require("../entities/campaign.entity");
const campaign_step_entity_1 = require("../entities/campaign-step.entity");
const campaign_member_entity_1 = require("../entities/campaign-member.entity");
const lead_entity_1 = require("../../lead/entities/lead.entity");
const lead_activity_entity_1 = require("../../lead/entities/lead-activity.entity");
const email_provider_service_1 = require("./email-provider.service");
let CampaignService = class CampaignService {
    constructor(templateRepository, campaignRepository, stepRepository, memberRepository, leadRepository, activityRepository, emailProviderService) {
        this.templateRepository = templateRepository;
        this.campaignRepository = campaignRepository;
        this.stepRepository = stepRepository;
        this.memberRepository = memberRepository;
        this.leadRepository = leadRepository;
        this.activityRepository = activityRepository;
        this.emailProviderService = emailProviderService;
    }
    async createTemplate(tenantId, userId, dto) {
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
    async findTemplates(tenantId) {
        return this.templateRepository.find({
            where: { tenant_id: tenantId },
            order: { created_at: 'DESC' },
        });
    }
    async deleteTemplate(tenantId, id) {
        const template = await this.templateRepository.findOne({ where: { id, tenant_id: tenantId } });
        if (!template)
            throw new common_1.NotFoundException('Template not found');
        return this.templateRepository.remove(template);
    }
    async createCampaign(tenantId, userId, dto) {
        const campaign = this.campaignRepository.create({
            tenant_id: tenantId,
            created_by: userId,
            name: dto.name,
            sender_email: dto.sender_email || 'outreach@leadsphere.io',
            stop_on_reply: dto.stop_on_reply !== false,
            stop_on_stage_change: dto.stop_on_stage_change !== false,
            status: campaign_entity_1.CampaignStatus.DRAFT,
        });
        const savedCampaign = await this.campaignRepository.save(campaign);
        if (dto.steps && dto.steps.length > 0) {
            const steps = dto.steps.map((s) => this.stepRepository.create({
                campaign_id: savedCampaign.id,
                step_order: s.step_order,
                step_type: s.step_type,
                template_id: s.template_id || undefined,
                wait_days: s.wait_days || 0,
                subject_override: s.subject_override || undefined,
            }));
            await this.stepRepository.save(steps);
        }
        return this.findCampaignById(tenantId, savedCampaign.id);
    }
    async findCampaigns(tenantId) {
        return this.campaignRepository.find({
            where: { tenant_id: tenantId },
            relations: ['steps', 'steps.template'],
            order: { created_at: 'DESC' },
        });
    }
    async findCampaignById(tenantId, id) {
        const campaign = await this.campaignRepository.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['steps', 'steps.template'],
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        return campaign;
    }
    async updateCampaignStatus(tenantId, id, status) {
        const campaign = await this.findCampaignById(tenantId, id);
        campaign.status = status;
        return this.campaignRepository.save(campaign);
    }
    async enrollLeads(tenantId, userId, campaignId, leadIds) {
        const campaign = await this.findCampaignById(tenantId, campaignId);
        if (!leadIds || leadIds.length === 0)
            throw new common_1.BadRequestException('No lead IDs provided for enrollment');
        const leads = await this.leadRepository.find({
            where: { tenant_id: tenantId, id: (0, typeorm_2.In)(leadIds) },
        });
        const members = [];
        for (const lead of leads) {
            const existing = await this.memberRepository.findOne({
                where: { campaign_id: campaignId, lead_id: lead.id },
            });
            if (!existing) {
                members.push(this.memberRepository.create({
                    campaign_id: campaignId,
                    lead_id: lead.id,
                    status: campaign_member_entity_1.CampaignMemberStatus.ACTIVE,
                    current_step_order: 1,
                    next_action_at: new Date(),
                }));
            }
        }
        if (members.length > 0) {
            await this.memberRepository.save(members);
            campaign.total_enrolled += members.length;
            if (campaign.status === campaign_entity_1.CampaignStatus.DRAFT) {
                campaign.status = campaign_entity_1.CampaignStatus.ACTIVE;
            }
            await this.campaignRepository.save(campaign);
        }
        this.runCampaignStepExecution(tenantId, campaignId).catch((err) => console.error('Campaign execution background error:', err));
        return { enrolled: members.length };
    }
    async runCampaignStepExecution(tenantId, campaignId) {
        const campaign = await this.findCampaignById(tenantId, campaignId);
        if (campaign.status !== campaign_entity_1.CampaignStatus.ACTIVE)
            return;
        const activeMembers = await this.memberRepository.find({
            where: { campaign_id: campaignId, status: campaign_member_entity_1.CampaignMemberStatus.ACTIVE },
            relations: ['lead'],
        });
        const steps = campaign.steps || [];
        if (steps.length === 0)
            return;
        for (const member of activeMembers) {
            const currentStep = steps.find((s) => s.step_order === member.current_step_order);
            if (!currentStep) {
                member.status = campaign_member_entity_1.CampaignMemberStatus.COMPLETED;
                await this.memberRepository.save(member);
                continue;
            }
            if (currentStep.step_type === campaign_step_entity_1.CampaignStepType.SEND_EMAIL && currentStep.template) {
                const template = currentStep.template;
                const subject = this.emailProviderService.interpolate(currentStep.subject_override || template.subject, member.lead);
                const bodyHtml = this.emailProviderService.interpolate(template.body_html, member.lead);
                if (member.lead.email) {
                    await this.emailProviderService.sendEmail({
                        to: member.lead.email,
                        subject,
                        bodyHtml,
                        from: campaign.sender_email,
                    });
                    campaign.delivered_count++;
                    campaign.opened_count += Math.random() > 0.3 ? 1 : 0;
                    await this.campaignRepository.save(campaign);
                    await this.activityRepository.save(this.activityRepository.create({
                        tenant_id: tenantId,
                        lead_id: member.lead_id,
                        type: 'CAMPAIGN_EMAIL_SENT',
                        payload: { campaign_name: campaign.name, subject, step: member.current_step_order },
                    }));
                }
                member.last_sent_at = new Date();
                member.current_step_order++;
                if (member.current_step_order > steps.length) {
                    member.status = campaign_member_entity_1.CampaignMemberStatus.COMPLETED;
                }
                else {
                    const nextStep = steps.find((s) => s.step_order === member.current_step_order);
                    const nextAction = new Date();
                    if (nextStep && nextStep.step_type === campaign_step_entity_1.CampaignStepType.WAIT_DAYS) {
                        nextAction.setDate(nextAction.getDate() + nextStep.wait_days);
                        member.current_step_order++;
                    }
                    member.next_action_at = nextAction;
                }
                await this.memberRepository.save(member);
            }
        }
    }
    async getCampaignAnalytics(tenantId, campaignId) {
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
                active: members.filter((m) => m.status === campaign_member_entity_1.CampaignMemberStatus.ACTIVE).length,
                completed: members.filter((m) => m.status === campaign_member_entity_1.CampaignMemberStatus.COMPLETED).length,
                replied: members.filter((m) => m.status === campaign_member_entity_1.CampaignMemberStatus.REPLIED).length,
            },
        };
    }
};
exports.CampaignService = CampaignService;
exports.CampaignService = CampaignService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_template_entity_1.EmailTemplate)),
    __param(1, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __param(2, (0, typeorm_1.InjectRepository)(campaign_step_entity_1.CampaignStep)),
    __param(3, (0, typeorm_1.InjectRepository)(campaign_member_entity_1.CampaignMember)),
    __param(4, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __param(5, (0, typeorm_1.InjectRepository)(lead_activity_entity_1.LeadActivity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        email_provider_service_1.EmailProviderService])
], CampaignService);
//# sourceMappingURL=campaign.service.js.map