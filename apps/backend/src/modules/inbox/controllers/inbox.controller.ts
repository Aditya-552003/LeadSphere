import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { InboxService } from '../services/inbox.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { ConversationChannel } from '../entities/conversation.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Controller('inbox')
export class InboxController {
  constructor(
    private readonly inboxService: InboxService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('leads.view')
  async getConversations(
    @TenantContext() ctx: ITenantContext,
    @Query('channel') channel?: string,
  ) {
    const conversations = await this.inboxService.getConversations(ctx.tenantId, channel);
    return { data: conversations };
  }

  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('leads.view')
  async getMessages(
    @TenantContext() ctx: ITenantContext,
    @Param('id') id: string,
  ) {
    const messages = await this.inboxService.getMessages(ctx.tenantId, id);
    return { data: messages };
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('leads.update')
  async sendMessage(
    @TenantContext() ctx: ITenantContext,
    @Body()
    body: {
      conversation_id?: string;
      lead_id?: string;
      channel: ConversationChannel;
      body: string;
      media_url?: string;
    },
  ) {
    const message = await this.inboxService.sendMessage(ctx.tenantId, ctx.userId, body);
    return { data: message };
  }

  @Post('conversations/:id/close')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('leads.update')
  async closeConversation(
    @TenantContext() ctx: ITenantContext,
    @Param('id') id: string,
  ) {
    const conversation = await this.inboxService.closeConversation(ctx.tenantId, id);
    return { data: conversation };
  }

  // --- Meta WhatsApp Webhooks ---
  @Get('whatsapp/webhook')
  @Public()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'leadsphere_webhook_token';
    if (mode === 'subscribe' && token === expectedToken) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  @Post('whatsapp/webhook')
  @Public()
  async handleWebhook(
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: any,
  ) {
    // Process inbound WhatsApp messages / delivery receipts from Meta Cloud API
    return { status: 'EVENT_RECEIVED' };
  }
}
