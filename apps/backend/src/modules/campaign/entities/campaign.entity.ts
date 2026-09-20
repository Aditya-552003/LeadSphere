import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CampaignStep } from './campaign-step.entity';
import { CampaignMember } from './campaign-member.entity';

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

@Entity('campaigns')
@Index(['tenant_id', 'status'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenant_id: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ type: 'varchar', length: 255, default: 'outreach@leadsphere.io' })
  sender_email: string;

  @Column({ type: 'int', default: 0 })
  total_enrolled: number;

  @Column({ type: 'int', default: 0 })
  delivered_count: number;

  @Column({ type: 'int', default: 0 })
  opened_count: number;

  @Column({ type: 'int', default: 0 })
  replied_count: number;

  @Column({ type: 'boolean', default: true })
  stop_on_reply: boolean;

  @Column({ type: 'boolean', default: true })
  stop_on_stage_change: boolean;

  @OneToMany(() => CampaignStep, (step) => step.campaign, { cascade: true })
  steps: CampaignStep[];

  @OneToMany(() => CampaignMember, (member) => member.campaign)
  members: CampaignMember[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
