import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('permission_overrides')
export class PermissionOverride {
  @PrimaryColumn({ type: 'uuid' })
  tenant_id: string;

  @PrimaryColumn({ type: 'uuid' })
  membership_id: string;

  @PrimaryColumn({ type: 'uuid' })
  permission_id: string;

  @Column({ type: 'text', enum: ['allow', 'deny'] })
  effect: 'allow' | 'deny';
}
