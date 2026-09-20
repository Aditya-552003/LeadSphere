import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { Lead } from '../../lead/entities/lead.entity';
import {
  ConversationChannel,
  SenderType,
  MessageDirection,
  DeliveryStatus,
} from '../enums/inbox.enums';

export { SenderType, MessageDirection, DeliveryStatus };

@Entity('messages')
@Index(['conversation_id', 'created_at'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversation_id: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ type: 'uuid' })
  @Index()
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  lead_id: string;

  @ManyToOne(() => Lead, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lead_id' })
  lead?: Lead;

  @Column({ type: 'enum', enum: SenderType, default: SenderType.USER })
  sender_type: SenderType;

  @Column({ type: 'uuid', nullable: true })
  sender_id: string;

  @Column({ type: 'enum', enum: ConversationChannel, default: ConversationChannel.EMAIL })
  channel: ConversationChannel;

  @Column({ type: 'enum', enum: MessageDirection, default: MessageDirection.OUTBOUND })
  direction: MessageDirection;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text', nullable: true })
  media_url: string;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.SENT })
  delivery_status: DeliveryStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  whatsapp_message_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
