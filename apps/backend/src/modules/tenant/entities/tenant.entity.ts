import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TenantStatus {
  PROVISIONING = 'provisioning',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING_DELETION = 'pending_deletion',
  DELETED = 'deleted',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ type: 'text', default: TenantStatus.ACTIVE })
  status: TenantStatus;

  @Column({ type: 'text', default: 'enterprise' })
  plan: string;

  @Column({ type: 'text', default: 'UTC' })
  timezone: string;

  @Column({ type: 'text', default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb', default: {} })
  branding: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
