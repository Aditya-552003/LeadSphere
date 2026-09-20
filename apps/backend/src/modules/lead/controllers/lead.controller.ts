import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { LeadService } from '../services/lead.service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Get()
  @RequirePermission('leads.view')
  async findAll(
    @TenantContext() ctx: ITenantContext,
    @Query('q') q?: string,
    @Query('limit') limit = 50,
    @Query('cursor') cursor?: string,
  ) {
    const result = await this.leadService.findAll(ctx.tenantId, q, +limit, cursor);
    return result;
  }

  @Get(':id')
  @RequirePermission('leads.view')
  async findOne(@TenantContext() ctx: ITenantContext, @Param('id') id: string) {
    const lead = await this.leadService.findOne(ctx.tenantId, id);
    return { data: lead };
  }

  @Post()
  @RequirePermission('leads.create')
  async create(@TenantContext() ctx: ITenantContext, @Body() dto: CreateLeadDto) {
    const lead = await this.leadService.create(ctx.tenantId, ctx.userId, dto);
    return { data: lead };
  }

  @Patch(':id')
  @RequirePermission('leads.update')
  async update(
    @TenantContext() ctx: ITenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    const lead = await this.leadService.update(ctx.tenantId, ctx.userId, id, dto);
    return { data: lead };
  }

  @Delete(':id')
  @RequirePermission('leads.delete')
  async remove(@TenantContext() ctx: ITenantContext, @Param('id') id: string) {
    const result = await this.leadService.remove(ctx.tenantId, ctx.userId, id);
    return { data: result };
  }

  @Get(':id/timeline')
  @RequirePermission('leads.view')
  async getTimeline(@TenantContext() ctx: ITenantContext, @Param('id') id: string) {
    const timeline = await this.leadService.getTimeline(ctx.tenantId, id);
    return { data: timeline };
  }

  @Post(':id/notes')
  @RequirePermission('leads.update')
  async addNote(
    @TenantContext() ctx: ITenantContext,
    @Param('id') id: string,
    @Body('body') body: string,
  ) {
    const note = await this.leadService.addNote(ctx.tenantId, id, ctx.membershipId, body);
    return { data: note };
  }
}
