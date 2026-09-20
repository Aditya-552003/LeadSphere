import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { Lead } from '../../lead/entities/lead.entity';

export enum CampaignMemberStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  REPLIED = 'replied',
  UNSUBSCRIBED = 'unsubscribed',
}

@Entity('campaign_members')
@Index(['campaign_id', 'lead_id'], { unique: true })
export class CampaignMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaign_id: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ type: 'uuid' })
  lead_id: string;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'enum', enum: CampaignMemberStatus, default: CampaignMemberStatus.ACTIVE })
  status: CampaignMemberStatus;

  @Column({ type: 'int', default: 1 })
  current_step_order: number;

  @Column({ type: 'timestamptz', nullable: true })
  next_action_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_sent_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
