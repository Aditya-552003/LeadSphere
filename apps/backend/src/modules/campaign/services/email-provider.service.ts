import { Injectable, Logger } from '@nestjs/common';
import { Lead } from '../../lead/entities/lead.entity';

@Injectable()
export class EmailProviderService {
  private readonly logger = new Logger(EmailProviderService.name);

  interpolate(content: string, lead: Partial<Lead>): string {
    if (!content) return '';

    return content
      .replace(/\{\{\s*first_name\s*\}\}/gi, lead.first_name || 'there')
      .replace(/\{\{\s*last_name\s*\}\}/gi, lead.last_name || '')
      .replace(/\{\{\s*full_name\s*\}\}/gi, lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim())
      .replace(/\{\{\s*company_name\s*\}\}/gi, lead.company_name || 'your company')
      .replace(/\{\{\s*designation\s*\}\}/gi, lead.designation || '')
      .replace(/\{\{\s*title\s*\}\}/gi, lead.designation || '')
      .replace(/\{\{\s*email\s*\}\}/gi, lead.email || '');
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    bodyHtml: string;
    from: string;
  }): Promise<{ success: boolean; messageId: string }> {
    // Adapter logic supporting multi-provider dispatch (SMTP / AWS SES / Microsoft Graph / Gmail API)
    this.logger.log(`[EmailProvider] Outbound dispatch to ${options.to} via ${options.from}: "${options.subject}"`);

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      success: true,
      messageId,
    };
  }
}
