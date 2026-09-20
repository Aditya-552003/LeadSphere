import { Repository } from 'typeorm';
import { Conversation, ConversationChannel } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Lead } from '../../lead/entities/lead.entity';
import { LeadActivity } from '../../lead/entities/lead-activity.entity';
import { WhatsAppService } from './whatsapp.service';
export declare class InboxService {
    private readonly conversationRepository;
    private readonly messageRepository;
    private readonly leadRepository;
    private readonly activityRepository;
    private readonly whatsappService;
    constructor(conversationRepository: Repository<Conversation>, messageRepository: Repository<Message>, leadRepository: Repository<Lead>, activityRepository: Repository<LeadActivity>, whatsappService: WhatsAppService);
    getConversations(tenantId: string, channel?: string): Promise<Conversation[]>;
    getMessages(tenantId: string, conversationId: string): Promise<Message[]>;
    sendMessage(tenantId: string, userId: string, dto: {
        conversation_id?: string;
        lead_id?: string;
        channel: ConversationChannel;
        body: string;
        media_url?: string;
    }): Promise<Message>;
    receiveInboundMessage(tenantId: string, leadId: string, channel: ConversationChannel, body: string): Promise<Message>;
    closeConversation(tenantId: string, conversationId: string): Promise<Conversation>;
    private findOrCreateConversation;
}
