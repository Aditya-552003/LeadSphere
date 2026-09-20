import { Conversation } from './conversation.entity';
import { Lead } from '../../lead/entities/lead.entity';
import { ConversationChannel, SenderType, MessageDirection, DeliveryStatus } from '../enums/inbox.enums';
export { SenderType, MessageDirection, DeliveryStatus };
export declare class Message {
    id: string;
    conversation_id: string;
    conversation: Conversation;
    tenant_id: string;
    lead_id: string;
    lead?: Lead;
    sender_type: SenderType;
    sender_id: string;
    channel: ConversationChannel;
    direction: MessageDirection;
    body: string;
    media_url: string;
    delivery_status: DeliveryStatus;
    whatsapp_message_id: string;
    created_at: Date;
}
