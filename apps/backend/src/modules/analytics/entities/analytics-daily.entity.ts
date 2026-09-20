import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('analytics_daily')
@Index(['tenant_id', 'date'], { unique: true })
export class AnalyticsDaily {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenant_id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int', default: 0 })
  total_leads: number;

  @Column({ type: 'int', default: 0 })
  new_leads: number;

  @Column({ type: 'int', default: 0 })
  emails_sent: number;

  @Column({ type: 'int', default: 0 })
  whatsapp_sent: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  deals_won_value: number;

  @Column({ type: 'int', default: 0 })
  deals_lost_count: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  conversion_rate: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
