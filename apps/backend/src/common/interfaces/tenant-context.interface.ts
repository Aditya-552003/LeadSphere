export interface ITenantContext {
  tenantId: string;
  userId: string;
  membershipId: string;
  role: string;
  sessionId: string;
  isPlatformAdmin: boolean;
  isImpersonating?: boolean;
}
