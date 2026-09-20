"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    constructor() {
        this.logger = new common_1.Logger(WhatsAppService_1.name);
    }
    isWithin24HourWindow(windowExpiresAt) {
        if (!windowExpiresAt)
            return false;
        return new Date(windowExpiresAt).getTime() > Date.now();
    }
    async sendSessionMessage(recipientPhone, text, windowExpiresAt) {
        if (!this.isWithin24HourWindow(windowExpiresAt)) {
            throw new common_1.BadRequestException('WhatsApp 24-Hour Customer Service Window has expired. You must send an approved Meta Template Message to initiate contact.');
        }
        this.logger.log(`[WhatsApp API] Sending session text to ${recipientPhone}: "${text}"`);
        const waId = `wamid.HBgL${Date.now()}${Math.random().toString(36).substring(2, 7)}`;
        return {
            success: true,
            whatsappMessageId: waId,
        };
    }
    async sendTemplateMessage(recipientPhone, templateName, language = 'en_US') {
        this.logger.log(`[WhatsApp API] Sending HSM Template '${templateName}' (${language}) to ${recipientPhone}`);
        const waId = `wamid.HBgL${Date.now()}${Math.random().toString(36).substring(2, 7)}`;
        return {
            success: true,
            whatsappMessageId: waId,
        };
    }
    verifyWebhookSignature(signatureHeader, payloadRaw) {
        const appSecret = process.env.WHATSAPP_APP_SECRET || 'leadsphere_secret';
        if (!signatureHeader)
            return true;
        const [algo, signature] = signatureHeader.split('=');
        if (algo !== 'sha256')
            return false;
        const hmac = crypto.createHmac('sha256', appSecret);
        const expected = hmac.update(payloadRaw).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)()
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map