import { Lead } from '../../lead/entities/lead.entity';
import { Message } from './message.entity';
import { ConversationChannel, ConversationStatus } from '../enums/inbox.enums';
export { ConversationChannel, ConversationStatus };
export declare class Conversation {
    id: string;
    tenant_id: string;
    lead_id: string;
    lead: Lead;
    channel: ConversationChannel;
    status: ConversationStatus;
    last_message_preview: string;
    last_message_at: Date;
    unread_count: number;
    window_expires_at: Date;
    messages: Message[];
    created_at: Date;
    updated_at: Date;
}
