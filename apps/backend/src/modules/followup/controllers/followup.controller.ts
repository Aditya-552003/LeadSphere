import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { FollowupService } from '../services/followup.service';
import { FollowupPriority, FollowupRecurrence } from '../entities/followup.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Controller('followups')
@UseGuards(JwtAuthGuard)
export class FollowupController {
  constructor(private readonly followupService: FollowupService) {}

  @Get()
  @RequirePermission('leads.view')
  async findAll(
    @TenantContext() ctx: ITenantContext,
    @Query('filterType') filterType?: 'overdue' | 'today' | 'upcoming' | 'completed' | 'all',
  ) {
    const followups = await this.followupService.findAll(ctx.tenantId, filterType);
    return { data: followups };
  }

  @Get('calendar')
  @RequirePermission('leads.view')
  async getCalendarEvents(
    @TenantContext() ctx: ITenantContext,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const events = await this.followupService.getCalendarEvents(ctx.tenantId, start, end);
    return { data: events };
  }

  @Post()
  @RequirePermission('leads.update')
  async create(
    @TenantContext() ctx: ITenantContext,
    @Body()
    body: {
      title: string;
      notes?: string;
      lead_id?: string;
      due_at: string;
      timezone?: string;
      priority?: FollowupPriority;
      recurrence?: FollowupRecurrence;
    },
  ) {
    const followup = await this.followupService.create(ctx.tenantId, ctx.userId, body);
    return { data: followup };
  }

  @Post(':id/complete')
  @RequirePermission('leads.update')
  async markCompleted(@TenantContext() ctx: ITenantContext, @Param('id') id: string) {
    const followup = await this.followupService.markCompleted(ctx.tenantId, ctx.userId, id);
    return { data: followup };
  }

  @Post(':id/snooze')
  @RequirePermission('leads.update')
  async snooze(
    @TenantContext() ctx: ITenantContext,
    @Param('id') id: string,
    @Body('snoozeHours') snoozeHours?: number,
  ) {
    const followup = await this.followupService.snooze(ctx.tenantId, id, snoozeHours || 24);
    return { data: followup };
  }

  @Delete(':id')
  @RequirePermission('leads.update')
  async remove(@TenantContext() ctx: ITenantContext, @Param('id') id: string) {
    const result = await this.followupService.remove(ctx.tenantId, id);
    return { data: result };
  }
}
