import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AiActionType {
  SUMMARIZE_LEAD = 'summarize_lead',
  DRAFT_EMAIL = 'draft_email',
  CLASSIFY_SENTIMENT = 'classify_sentiment',
  SUGGEST_NEXT_STEP = 'suggest_next_step',
}

@Entity('ai_requests')
@Index(['tenant_id', 'created_at'])
export class AiRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenant_id: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'enum', enum: AiActionType })
  action_type: AiActionType;

  @Column({ type: 'int', default: 0 })
  prompt_tokens: number;

  @Column({ type: 'int', default: 0 })
  completion_tokens: number;

  @Column({ type: 'varchar', length: 100, default: 'gpt-4o-mini' })
  model_name: string;

  @Column({ type: 'varchar', length: 255, default: 'AI-generated — verify before send' })
  disclaimer_label: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
