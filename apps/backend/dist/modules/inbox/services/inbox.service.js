"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const conversation_entity_1 = require("../entities/conversation.entity");
const message_entity_1 = require("../entities/message.entity");
const lead_entity_1 = require("../../lead/entities/lead.entity");
const lead_activity_entity_1 = require("../../lead/entities/lead-activity.entity");
const whatsapp_service_1 = require("./whatsapp.service");
let InboxService = class InboxService {
    constructor(conversationRepository, messageRepository, leadRepository, activityRepository, whatsappService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.leadRepository = leadRepository;
        this.activityRepository = activityRepository;
        this.whatsappService = whatsappService;
    }
    async getConversations(tenantId, channel) {
        const query = this.conversationRepository
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.lead', 'lead')
            .where('c.tenant_id = :tenantId', { tenantId });
        if (channel && channel !== 'all') {
            query.andWhere('c.channel = :channel', { channel });
        }
        query.orderBy('c.last_message_at', 'DESC');
        return query.getMany();
    }
    async getMessages(tenantId, conversationId) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId, tenant_id: tenantId },
        });
        if (!conversation)
            throw new common_1.NotFoundException('Conversation not found');
        if (conversation.unread_count > 0) {
            conversation.unread_count = 0;
            await this.conversationRepository.save(conversation);
        }
        return this.messageRepository.find({
            where: { conversation_id: conversationId, tenant_id: tenantId },
            order: { created_at: 'ASC' },
        });
    }
    async sendMessage(tenantId, userId, dto) {
        let conversation = null;
        if (dto.conversation_id) {
            conversation = await this.conversationRepository.findOne({
                where: { id: dto.conversation_id, tenant_id: tenantId },
                relations: ['lead'],
            });
        }
        else if (dto.lead_id) {
            conversation = await this.findOrCreateConversation(tenantId, dto.lead_id, dto.channel);
        }
        if (!conversation) {
            throw new common_1.BadRequestException('Must provide either valid conversation_id or lead_id');
        }
        let waMessageId = undefined;
        if (dto.channel === conversation_entity_1.ConversationChannel.WHATSAPP) {
            const recipientPhone = conversation.lead?.phone || '+15550192831';
            const result = await this.whatsappService.sendSessionMessage(recipientPhone, dto.body, conversation.window_expires_at);
            waMessageId = result.whatsappMessageId;
        }
        const message = this.messageRepository.create({
            conversation_id: conversation.id,
            tenant_id: tenantId,
            lead_id: conversation.lead_id,
            sender_type: message_entity_1.SenderType.USER,
            sender_id: userId,
            channel: dto.channel,
            direction: message_entity_1.MessageDirection.OUTBOUND,
            body: dto.body,
            media_url: dto.media_url,
            delivery_status: message_entity_1.DeliveryStatus.DELIVERED,
            whatsapp_message_id: waMessageId,
        });
        const savedMessage = await this.messageRepository.save(message);
        conversation.last_message_preview = dto.body.length > 80 ? dto.body.substring(0, 80) + '...' : dto.body;
        conversation.last_message_at = new Date();
        await this.conversationRepository.save(conversation);
        await this.activityRepository.save(this.activityRepository.create({
            tenant_id: tenantId,
            lead_id: conversation.lead_id,
            actor_membership_id: userId,
            type: dto.channel === conversation_entity_1.ConversationChannel.WHATSAPP ? 'WHATSAPP_SENT' : 'EMAIL_SENT',
            payload: { body: dto.body, channel: dto.channel },
        }));
        return savedMessage;
    }
    async receiveInboundMessage(tenantId, leadId, channel, body) {
        const conversation = await this.findOrCreateConversation(tenantId, leadId, channel);
        if (channel === conversation_entity_1.ConversationChannel.WHATSAPP) {
            const expires = new Date();
            expires.setHours(expires.getHours() + 24);
            conversation.window_expires_at = expires;
        }
        const message = this.messageRepository.create({
            conversation_id: conversation.id,
            tenant_id: tenantId,
            lead_id: leadId,
            sender_type: message_entity_1.SenderType.LEAD,
            channel,
            direction: message_entity_1.MessageDirection.INBOUND,
            body,
            delivery_status: message_entity_1.DeliveryStatus.READ,
        });
        const savedMessage = await this.messageRepository.save(message);
        conversation.last_message_preview = body.length > 80 ? body.substring(0, 80) + '...' : body;
        conversation.last_message_at = new Date();
        conversation.unread_count += 1;
        await this.conversationRepository.save(conversation);
        await this.activityRepository.save(this.activityRepository.create({
            tenant_id: tenantId,
            lead_id: leadId,
            type: 'INBOUND_MESSAGE_RECEIVED',
            payload: { channel, body },
        }));
        return savedMessage;
    }
    async closeConversation(tenantId, conversationId) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId, tenant_id: tenantId },
        });
        if (!conversation)
            throw new common_1.NotFoundException('Conversation not found');
        conversation.status = conversation_entity_1.ConversationStatus.CLOSED;
        return this.conversationRepository.save(conversation);
    }
    async findOrCreateConversation(tenantId, leadId, channel) {
        let conversation = await this.conversationRepository.findOne({
            where: { tenant_id: tenantId, lead_id: leadId, channel },
            relations: ['lead'],
        });
        if (!conversation) {
            const expires = new Date();
            expires.setHours(expires.getHours() + 24);
            conversation = this.conversationRepository.create({
                tenant_id: tenantId,
                lead_id: leadId,
                channel,
                status: conversation_entity_1.ConversationStatus.OPEN,
                window_expires_at: expires,
                last_message_at: new Date(),
            });
            conversation = await this.conversationRepository.save(conversation);
            conversation = await this.conversationRepository.findOne({
                where: { id: conversation.id },
                relations: ['lead'],
            });
        }
        return conversation;
    }
};
exports.InboxService = InboxService;
exports.InboxService = InboxService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(conversation_entity_1.Conversation)),
    __param(1, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(2, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __param(3, (0, typeorm_1.InjectRepository)(lead_activity_entity_1.LeadActivity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        whatsapp_service_1.WhatsAppService])
], InboxService);
//# sourceMappingURL=inbox.service.js.map