import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('lead_activities')
export class LeadActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  lead_id: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'uuid', nullable: true })
  actor_membership_id: string;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  occurred_at: Date;
}
