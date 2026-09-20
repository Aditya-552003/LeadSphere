import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { InviteUserDto } from '../dto/invite-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Controller('team')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('users')
  @RequirePermission('users.view')
  async findTeamMembers(@TenantContext() ctx: ITenantContext) {
    const members = await this.userService.findTeamMembers(ctx.tenantId);
    return { data: members };
  }

  @Post('invitations')
  @RequirePermission('users.create')
  async inviteUser(@TenantContext() ctx: ITenantContext, @Body() dto: InviteUserDto) {
    const result = await this.userService.inviteUser(ctx.tenantId, ctx.userId, dto);
    return { data: result };
  }

  @Patch('users/:id/role')
  @RequirePermission('users.update')
  async updateUserRole(
    @TenantContext() ctx: ITenantContext,
    @Param('id') membershipId: string,
    @Body('role_id') roleId: string,
  ) {
    const result = await this.userService.updateUserRole(ctx.tenantId, ctx.userId, membershipId, roleId);
    return { data: result };
  }

  @Post('users/:id/deactivate')
  @RequirePermission('users.delete')
  async deactivateMember(@TenantContext() ctx: ITenantContext, @Param('id') membershipId: string) {
    const result = await this.userService.deactivateMember(ctx.tenantId, ctx.userId, membershipId);
    return { data: result };
  }
}
