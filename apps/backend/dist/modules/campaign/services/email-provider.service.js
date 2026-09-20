"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmailProviderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProviderService = void 0;
const common_1 = require("@nestjs/common");
let EmailProviderService = EmailProviderService_1 = class EmailProviderService {
    constructor() {
        this.logger = new common_1.Logger(EmailProviderService_1.name);
    }
    interpolate(content, lead) {
        if (!content)
            return '';
        return content
            .replace(/\{\{\s*first_name\s*\}\}/gi, lead.first_name || 'there')
            .replace(/\{\{\s*last_name\s*\}\}/gi, lead.last_name || '')
            .replace(/\{\{\s*full_name\s*\}\}/gi, lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim())
            .replace(/\{\{\s*company_name\s*\}\}/gi, lead.company_name || 'your company')
            .replace(/\{\{\s*designation\s*\}\}/gi, lead.designation || '')
            .replace(/\{\{\s*title\s*\}\}/gi, lead.designation || '')
            .replace(/\{\{\s*email\s*\}\}/gi, lead.email || '');
    }
    async sendEmail(options) {
        this.logger.log(`[EmailProvider] Outbound dispatch to ${options.to} via ${options.from}: "${options.subject}"`);
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        return {
            success: true,
            messageId,
        };
    }
};
exports.EmailProviderService = EmailProviderService;
exports.EmailProviderService = EmailProviderService = EmailProviderService_1 = __decorate([
    (0, common_1.Injectable)()
], EmailProviderService);
//# sourceMappingURL=email-provider.service.js.map