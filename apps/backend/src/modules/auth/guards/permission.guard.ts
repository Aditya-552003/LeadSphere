import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../../../common/decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new ForbiddenException('Tenant context missing');
    }

    // Company Admins & Platform Admins bypass granular permission checks
    if (tenantContext.isPlatformAdmin || tenantContext.role === 'company_admin') {
      return true;
    }

    // Visitors only have view permissions
    if (tenantContext.role === 'visitor' && !requiredPermission.endsWith('.view')) {
      throw new ForbiddenException(`Role '${tenantContext.role}' cannot perform '${requiredPermission}'`);
    }

    return true;
  }
}
