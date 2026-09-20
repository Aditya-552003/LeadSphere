import { Lead } from '../../lead/entities/lead.entity';
export declare class EmailProviderService {
    private readonly logger;
    interpolate(content: string, lead: Partial<Lead>): string;
    sendEmail(options: {
        to: string;
        subject: string;
        bodyHtml: string;
        from: string;
    }): Promise<{
        success: boolean;
        messageId: string;
    }>;
}
