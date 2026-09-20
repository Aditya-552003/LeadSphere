import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ITenantContext } from '../interfaces/tenant-context.interface';

export const TenantContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ITenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext;
  },
);
