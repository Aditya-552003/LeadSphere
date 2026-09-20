import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermission';
export const RequirePermission = (permissionCode: string) => SetMetadata(PERMISSION_KEY, permissionCode);
