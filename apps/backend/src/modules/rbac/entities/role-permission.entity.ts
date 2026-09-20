import { Entity, PrimaryColumn } from 'typeorm';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ type: 'uuid' })
  tenant_id: string;

  @PrimaryColumn({ type: 'uuid' })
  role_id: string;

  @PrimaryColumn({ type: 'uuid' })
  permission_id: string;
}
