import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermission('audit.view')
  async findAll(
    @TenantContext() ctx: ITenantContext,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    const result = await this.auditService.findByTenant(ctx.tenantId, +limit, +offset);
    return result;
  }
}
