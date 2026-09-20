import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  isWithin24HourWindow(windowExpiresAt?: Date | null): boolean {
    if (!windowExpiresAt) return false;
    return new Date(windowExpiresAt).getTime() > Date.now();
  }

  async sendSessionMessage(
    recipientPhone: string,
    text: string,
    windowExpiresAt?: Date | null,
  ): Promise<{ success: boolean; whatsappMessageId: string }> {
    if (!this.isWithin24HourWindow(windowExpiresAt)) {
      throw new BadRequestException(
        'WhatsApp 24-Hour Customer Service Window has expired. You must send an approved Meta Template Message to initiate contact.',
      );
    }

    this.logger.log(`[WhatsApp API] Sending session text to ${recipientPhone}: "${text}"`);
    const waId = `wamid.HBgL${Date.now()}${Math.random().toString(36).substring(2, 7)}`;

    return {
      success: true,
      whatsappMessageId: waId,
    };
  }

  async sendTemplateMessage(
    recipientPhone: string,
    templateName: string,
    language = 'en_US',
  ): Promise<{ success: boolean; whatsappMessageId: string }> {
    this.logger.log(`[WhatsApp API] Sending HSM Template '${templateName}' (${language}) to ${recipientPhone}`);
    const waId = `wamid.HBgL${Date.now()}${Math.random().toString(36).substring(2, 7)}`;

    return {
      success: true,
      whatsappMessageId: waId,
    };
  }

  verifyWebhookSignature(signatureHeader: string, payloadRaw: string): boolean {
    const appSecret = process.env.WHATSAPP_APP_SECRET || 'leadsphere_secret';
    if (!signatureHeader) return true; // dev mode fallback

    const [algo, signature] = signatureHeader.split('=');
    if (algo !== 'sha256') return false;

    const hmac = crypto.createHmac('sha256', appSecret);
    const expected = hmac.update(payloadRaw).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}
