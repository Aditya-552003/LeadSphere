import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from '../services/ai.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize-lead')
  @RequirePermission('leads.view')
  async summarizeLead(
    @TenantContext() ctx: ITenantContext,
    @Body('leadId') leadId: string,
  ) {
    const result = await this.aiService.summarizeLead(ctx.tenantId, ctx.userId, leadId);
    return { data: result };
  }

  @Post('draft-email')
  @RequirePermission('leads.view')
  async draftEmail(
    @TenantContext() ctx: ITenantContext,
    @Body() body: { leadId: string; tone?: 'professional' | 'persuasive' | 'casual' },
  ) {
    const result = await this.aiService.draftOutreachEmail(ctx.tenantId, ctx.userId, body.leadId, body.tone);
    return { data: result };
  }

  @Post('classify-sentiment')
  @RequirePermission('leads.view')
  async classifySentiment(
    @TenantContext() ctx: ITenantContext,
    @Body('text') text: string,
  ) {
    const result = await this.aiService.classifySentiment(ctx.tenantId, ctx.userId, text);
    return { data: result };
  }
}
