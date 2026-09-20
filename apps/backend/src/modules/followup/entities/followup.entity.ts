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
import { Lead } from '../../lead/entities/lead.entity';

export enum FollowupPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum FollowupStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  SNOOZED = 'snoozed',
  CANCELLED = 'cancelled',
}

export enum FollowupRecurrence {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Entity('followups')
@Index(['tenant_id', 'due_at'])
@Index(['tenant_id', 'status'])
export class Followup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenant_id: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string;

  @Column({ type: 'uuid', nullable: true })
  lead_id: string;

  @ManyToOne(() => Lead, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lead_id' })
  lead?: Lead;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamptz' })
  due_at: Date;

  @Column({ type: 'varchar', length: 100, default: 'UTC' })
  timezone: string;

  @Column({ type: 'enum', enum: FollowupPriority, default: FollowupPriority.MEDIUM })
  priority: FollowupPriority;

  @Column({ type: 'enum', enum: FollowupStatus, default: FollowupStatus.PENDING })
  status: FollowupStatus;

  @Column({ type: 'timestamptz', nullable: true })
  snoozed_until: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @Column({ type: 'enum', enum: FollowupRecurrence, default: FollowupRecurrence.NONE })
  recurrence: FollowupRecurrence;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
