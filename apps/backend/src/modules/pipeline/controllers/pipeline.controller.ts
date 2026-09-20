import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PipelineService } from '../services/pipeline.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Controller('pipeline')
@UseGuards(JwtAuthGuard)
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get('stages')
  @RequirePermission('pipeline.view')
  async findStages(@TenantContext() ctx: ITenantContext) {
    const stages = await this.pipelineService.findStages(ctx.tenantId);
    return { data: stages };
  }

  @Post('stages')
  @RequirePermission('pipeline.manage')
  async createStage(
    @TenantContext() ctx: ITenantContext,
    @Body() body: { name: string; color: string; probability?: number },
  ) {
    const stage = await this.pipelineService.createStage(ctx.tenantId, body.name, body.color, body.probability);
    return { data: stage };
  }
}
