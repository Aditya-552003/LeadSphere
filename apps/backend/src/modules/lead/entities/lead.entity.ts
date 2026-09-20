import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

export enum LeadScoreSource {
  MANUAL = 'manual',
  RULE = 'rule',
  AI = 'ai',
}

@Entity('leads')
@Unique(['tenant_id', 'id'])
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text', nullable: true })
  first_name: string;

  @Column({ type: 'text', nullable: true })
  last_name: string;

  @Column({ type: 'text' })
  full_name: string;

  @Column({ type: 'text', nullable: true })
  company_name: string;

  @Column({ type: 'text', nullable: true })
  designation: string;

  @Column({ type: 'text', nullable: true })
  industry: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  email_normalized: string;

  @Column({ type: 'text', nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  phone_e164: string;

  @Column({ type: 'text', nullable: true })
  whatsapp_e164: string;

  @Column({ type: 'text', nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  linkedin: string;

  @Column({ type: 'text', nullable: true })
  country: string;

  @Column({ type: 'text', nullable: true })
  state: string;

  @Column({ type: 'text', nullable: true })
  city: string;

  @Column({ type: 'text', default: 'manual' })
  source: string;

  @Column({ type: 'uuid', nullable: true })
  status_stage_id: string;

  @Column({ type: 'smallint', default: 0 })
  lead_score: number;

  @Column({ type: 'text', default: LeadScoreSource.RULE })
  score_source: LeadScoreSource;

  @Column({ type: 'uuid', nullable: true })
  owner_membership_id: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_contacted_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  next_followup_at: Date;

  @Column({ type: 'boolean', default: false })
  do_not_contact: boolean;

  @Column({ type: 'boolean', default: false })
  email_opt_out: boolean;

  @Column({ type: 'boolean', default: false })
  whatsapp_opt_out: boolean;

  @Column({ type: 'jsonb', default: {} })
  custom: Record<string, any>;

  @Column({ type: 'timestamptz', nullable: true })
  archived_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date;

  @Column({ type: 'uuid', nullable: true })
  import_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
