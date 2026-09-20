import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  actor_id: string;

  @Column({ type: 'text' })
  actor_type: 'user' | 'system' | 'super_admin_support';

  @Column({ type: 'uuid', nullable: true })
  on_behalf_of_tenant: string;

  @Column({ type: 'uuid', nullable: true })
  support_session_id: string;

  @Column({ type: 'text' })
  action: string;

  @Column({ type: 'text' })
  entity_type: string;

  @Column({ type: 'uuid', nullable: true })
  entity_id: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @Column({ type: 'uuid', nullable: true })
  request_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
