import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { EmailTemplate } from './email-template.entity';

export enum CampaignStepType {
  SEND_EMAIL = 'send_email',
  WAIT_DAYS = 'wait_days',
}

@Entity('campaign_steps')
export class CampaignStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaign_id: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ type: 'int' })
  step_order: number;

  @Column({ type: 'enum', enum: CampaignStepType, default: CampaignStepType.SEND_EMAIL })
  step_type: CampaignStepType;

  @Column({ type: 'uuid', nullable: true })
  template_id: string;

  @ManyToOne(() => EmailTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'template_id' })
  template?: EmailTemplate;

  @Column({ type: 'int', default: 0 })
  wait_days: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject_override: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
