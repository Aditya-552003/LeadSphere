import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RbacService } from '../services/rbac.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @RequirePermission('roles.manage')
  async findRoles(@TenantContext() ctx: ITenantContext) {
    const roles = await this.rbacService.findRoles(ctx.tenantId);
    return { data: roles };
  }

  @Get('permissions')
  @RequirePermission('roles.manage')
  async findPermissions() {
    const permissions = await this.rbacService.findPermissions();
    return { data: permissions };
  }

  @Post()
  @RequirePermission('roles.manage')
  async createRole(@TenantContext() ctx: ITenantContext, @Body() body: { name: string; description?: string }) {
    const role = await this.rbacService.createRole(ctx.tenantId, body.name, body.description);
    return { data: role };
  }
}
