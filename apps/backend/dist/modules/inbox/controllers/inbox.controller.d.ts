import { Response } from 'express';
import { InboxService } from '../services/inbox.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { ConversationChannel } from '../entities/conversation.entity';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';
export declare class InboxController {
    private readonly inboxService;
    private readonly whatsappService;
    constructor(inboxService: InboxService, whatsappService: WhatsAppService);
    getConversations(ctx: ITenantContext, channel?: string): Promise<{
        data: import("../entities/conversation.entity").Conversation[];
    }>;
    getMessages(ctx: ITenantContext, id: string): Promise<{
        data: import("../entities/message.entity").Message[];
    }>;
    sendMessage(ctx: ITenantContext, body: {
        conversation_id?: string;
        lead_id?: string;
        channel: ConversationChannel;
        body: string;
        media_url?: string;
    }): Promise<{
        data: import("../entities/message.entity").Message;
    }>;
    closeConversation(ctx: ITenantContext, id: string): Promise<{
        data: import("../entities/conversation.entity").Conversation;
    }>;
    verifyWebhook(mode: string, token: string, challenge: string, res: Response): Response<any, Record<string, any>>;
    handleWebhook(signature: string, body: any): Promise<{
        status: string;
    }>;
}
