export declare class WhatsAppService {
    private readonly logger;
    isWithin24HourWindow(windowExpiresAt?: Date | null): boolean;
    sendSessionMessage(recipientPhone: string, text: string, windowExpiresAt?: Date | null): Promise<{
        success: boolean;
        whatsappMessageId: string;
    }>;
    sendTemplateMessage(recipientPhone: string, templateName: string, language?: string): Promise<{
        success: boolean;
        whatsappMessageId: string;
    }>;
    verifyWebhookSignature(signatureHeader: string, payloadRaw: string): boolean;
}
