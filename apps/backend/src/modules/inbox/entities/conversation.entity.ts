import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lead } from '../../lead/entities/lead.entity';
import { Message } from './message.entity';
import { ConversationChannel, ConversationStatus } from '../enums/inbox.enums';

export { ConversationChannel, ConversationStatus };

@Entity('conversations')
@Index(['tenant_id', 'last_message_at'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenant_id: string;

  @Column({ type: 'uuid' })
  lead_id: string;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'enum', enum: ConversationChannel, default: ConversationChannel.EMAIL })
  channel: ConversationChannel;

  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.OPEN })
  status: ConversationStatus;

  @Column({ type: 'text', nullable: true })
  last_message_preview: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_message_at: Date;

  @Column({ type: 'int', default: 0 })
  unread_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  window_expires_at: Date; // 24-hr WhatsApp window expiry

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
