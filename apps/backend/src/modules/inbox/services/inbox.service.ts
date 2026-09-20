import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Conversation,
  ConversationChannel,
  ConversationStatus,
} from '../entities/conversation.entity';
import {
  Message,
  SenderType,
  MessageDirection,
  DeliveryStatus,
} from '../entities/message.entity';
import { Lead } from '../../lead/entities/lead.entity';
import { LeadActivity } from '../../lead/entities/lead-activity.entity';
import { WhatsAppService } from './whatsapp.service';

@Injectable()
export class InboxService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(LeadActivity)
    private readonly activityRepository: Repository<LeadActivity>,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async getConversations(tenantId: string, channel?: string) {
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

  async getMessages(tenantId: string, conversationId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, tenant_id: tenantId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    // Reset unread count
    if (conversation.unread_count > 0) {
      conversation.unread_count = 0;
      await this.conversationRepository.save(conversation);
    }

    return this.messageRepository.find({
      where: { conversation_id: conversationId, tenant_id: tenantId },
      order: { created_at: 'ASC' },
    });
  }

  async sendMessage(
    tenantId: string,
    userId: string,
    dto: {
      conversation_id?: string;
      lead_id?: string;
      channel: ConversationChannel;
      body: string;
      media_url?: string;
    },
  ) {
    let conversation: Conversation | null = null;

    if (dto.conversation_id) {
      conversation = await this.conversationRepository.findOne({
        where: { id: dto.conversation_id, tenant_id: tenantId },
        relations: ['lead'],
      });
    } else if (dto.lead_id) {
      conversation = await this.findOrCreateConversation(tenantId, dto.lead_id, dto.channel);
    }

    if (!conversation) {
      throw new BadRequestException('Must provide either valid conversation_id or lead_id');
    }

    let waMessageId: string | undefined = undefined;

    // Handle WhatsApp 24-hr window check
    if (dto.channel === ConversationChannel.WHATSAPP) {
      const recipientPhone = conversation.lead?.phone || '+15550192831';
      const result = await this.whatsappService.sendSessionMessage(
        recipientPhone,
        dto.body,
        conversation.window_expires_at,
      );
      waMessageId = result.whatsappMessageId;
    }

    // Create Outbound Message
    const message = this.messageRepository.create({
      conversation_id: conversation.id,
      tenant_id: tenantId,
      lead_id: conversation.lead_id,
      sender_type: SenderType.USER,
      sender_id: userId,
      channel: dto.channel,
      direction: MessageDirection.OUTBOUND,
      body: dto.body,
      media_url: dto.media_url,
      delivery_status: DeliveryStatus.DELIVERED,
      whatsapp_message_id: waMessageId,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation preview
    conversation.last_message_preview = dto.body.length > 80 ? dto.body.substring(0, 80) + '...' : dto.body;
    conversation.last_message_at = new Date();
    await this.conversationRepository.save(conversation);

    // Log Activity
    await this.activityRepository.save(
      this.activityRepository.create({
        tenant_id: tenantId,
        lead_id: conversation.lead_id,
        actor_membership_id: userId,
        type: dto.channel === ConversationChannel.WHATSAPP ? 'WHATSAPP_SENT' : 'EMAIL_SENT',
        payload: { body: dto.body, channel: dto.channel },
      }),
    );

    return savedMessage;
  }

  async receiveInboundMessage(
    tenantId: string,
    leadId: string,
    channel: ConversationChannel,
    body: string,
  ) {
    const conversation = await this.findOrCreateConversation(tenantId, leadId, channel);

    // Set 24-Hour WhatsApp Customer Service Window expiration
    if (channel === ConversationChannel.WHATSAPP) {
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      conversation.window_expires_at = expires;
    }

    const message = this.messageRepository.create({
      conversation_id: conversation.id,
      tenant_id: tenantId,
      lead_id: leadId,
      sender_type: SenderType.LEAD,
      channel,
      direction: MessageDirection.INBOUND,
      body,
      delivery_status: DeliveryStatus.READ,
    });

    const savedMessage = await this.messageRepository.save(message);

    conversation.last_message_preview = body.length > 80 ? body.substring(0, 80) + '...' : body;
    conversation.last_message_at = new Date();
    conversation.unread_count += 1;
    await this.conversationRepository.save(conversation);

    await this.activityRepository.save(
      this.activityRepository.create({
        tenant_id: tenantId,
        lead_id: leadId,
        type: 'INBOUND_MESSAGE_RECEIVED',
        payload: { channel, body },
      }),
    );

    return savedMessage;
  }

  async closeConversation(tenantId: string, conversationId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, tenant_id: tenantId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    conversation.status = ConversationStatus.CLOSED;
    return this.conversationRepository.save(conversation);
  }

  private async findOrCreateConversation(
    tenantId: string,
    leadId: string,
    channel: ConversationChannel,
  ): Promise<Conversation> {
    let conversation = await this.conversationRepository.findOne({
      where: { tenant_id: tenantId, lead_id: leadId, channel },
      relations: ['lead'],
    });

    if (!conversation) {
      const expires = new Date();
      expires.setHours(expires.getHours() + 24); // default 24h window for dev test

      conversation = this.conversationRepository.create({
        tenant_id: tenantId,
        lead_id: leadId,
        channel,
        status: ConversationStatus.OPEN,
        window_expires_at: expires,
        last_message_at: new Date(),
      });
      conversation = await this.conversationRepository.save(conversation);
      conversation = await this.conversationRepository.findOne({
        where: { id: conversation.id },
        relations: ['lead'],
      }) as Conversation;
    }

    return conversation;
  }
}
