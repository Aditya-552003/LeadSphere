import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { CampaignService } from '../services/campaign.service';
import { CampaignStatus } from '../entities/campaign.entity';
import { CampaignStepType } from '../entities/campaign-step.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  // --- Templates ---
  @Get('templates')
  @RequirePermission('campaigns.view')
  async findTemplates(@TenantContext() ctx: ITenantContext) {
    const templates = await this.campaignService.findTemplates(ctx.tenantId);
    return { data: templates };
  }

  @Post('templates')
  @RequirePermission('campaigns.manage')
  async createTemplate(
    @TenantContext() ctx: ITenantContext,
    @Body() body: { name: string; subject: string; body_html: string; variables?: string[] },
  ) {
    const template = await this.campaignService.createTemplate(ctx.tenantId, ctx.userId, body);
    return { data: template };
  }

  @Delete('templates/:id')
  @RequirePermission('campaigns.manage')
  async deleteTemplate(@TenantContext() ctx: ITenantContext, @Param('id') id: string) {
    const result = await this.campaignService.deleteTemplate(ctx.tenantId, id);
    return { data: result };
  }

  // --- Campaigns ---
  @Get()
  @RequirePermission('campaigns.view')
  async findCampaigns(@TenantContext() ctx: ITenantContext) {
    const campaigns = await this.campaignService.findCampaigns(ctx.tenantId);
    return { data: campaigns };
  }

  @Post()
  @RequirePermission('campaigns.manage')
  async createCampaign(
    @TenantContext() ctx: ITenantContext,
    @Body()
    body: {
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
    const campaign = await this.campaignService.createCampaign(ctx.tenantId, ctx.userId, body);
    return { data: campaign };
  }

  @Get(':id')
  @RequirePermission('campaigns.view')
  async findCampaignById(@TenantContext() ctx: ITenantContext, @Param('id') id: string) {
    const campaign = await this.campaignService.findCampaignById(ctx.tenantId, id);
    return { data: campaign };
  }

  @Patch(':id/status')
  @RequirePermission('campaigns.manage')
  async updateStatus(
    @TenantContext() ctx: ITenantContext,
    @Param('id') id: string,
    @Body('status') status: CampaignStatus,
  ) {
    const campaign = await this.campaignService.updateCampaignStatus(ctx.tenantId, id, status);
    return { data: campaign };
  }

  @Post(':id/enroll')
  @RequirePermission('campaigns.manage')
  async enrollLeads(
    @TenantContext() ctx: ITenantContext,
    @Param('id') id: string,
    @Body('leadIds') leadIds: string[],
  ) {
    const result = await this.campaignService.enrollLeads(ctx.tenantId, ctx.userId, id, leadIds);
    return { data: result };
  }

  @Get(':id/analytics')
  @RequirePermission('campaigns.view')
  async getAnalytics(@TenantContext() ctx: ITenantContext, @Param('id') id: string) {
    const analytics = await this.campaignService.getCampaignAnalytics(ctx.tenantId, id);
    return { data: analytics };
  }
}
