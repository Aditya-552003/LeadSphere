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
exports.InboxController = void 0;
const common_1 = require("@nestjs/common");
const inbox_service_1 = require("../services/inbox.service");
const whatsapp_service_1 = require("../services/whatsapp.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const tenant_context_decorator_1 = require("../../../common/decorators/tenant-context.decorator");
let InboxController = class InboxController {
    constructor(inboxService, whatsappService) {
        this.inboxService = inboxService;
        this.whatsappService = whatsappService;
    }
    async getConversations(ctx, channel) {
        const conversations = await this.inboxService.getConversations(ctx.tenantId, channel);
        return { data: conversations };
    }
    async getMessages(ctx, id) {
        const messages = await this.inboxService.getMessages(ctx.tenantId, id);
        return { data: messages };
    }
    async sendMessage(ctx, body) {
        const message = await this.inboxService.sendMessage(ctx.tenantId, ctx.userId, body);
        return { data: message };
    }
    async closeConversation(ctx, id) {
        const conversation = await this.inboxService.closeConversation(ctx.tenantId, id);
        return { data: conversation };
    }
    verifyWebhook(mode, token, challenge, res) {
        const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'leadsphere_webhook_token';
        if (mode === 'subscribe' && token === expectedToken) {
            return res.status(200).send(challenge);
        }
        return res.status(403).send('Forbidden');
    }
    async handleWebhook(signature, body) {
        return { status: 'EVENT_RECEIVED' };
    }
};
exports.InboxController = InboxController;
__decorate([
    (0, common_1.Get)('conversations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, require_permission_decorator_1.RequirePermission)('leads.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('channel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InboxController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:id/messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, require_permission_decorator_1.RequirePermission)('leads.view'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InboxController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, require_permission_decorator_1.RequirePermission)('leads.update'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InboxController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('conversations/:id/close'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, require_permission_decorator_1.RequirePermission)('leads.update'),
    __param(0, (0, tenant_context_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InboxController.prototype, "closeConversation", null);
__decorate([
    (0, common_1.Get)('whatsapp/webhook'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], InboxController.prototype, "verifyWebhook", null);
__decorate([
    (0, common_1.Post)('whatsapp/webhook'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Headers)('x-hub-signature-256')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InboxController.prototype, "handleWebhook", null);
exports.InboxController = InboxController = __decorate([
    (0, common_1.Controller)('inbox'),
    __metadata("design:paramtypes", [inbox_service_1.InboxService,
        whatsapp_service_1.WhatsAppService])
], InboxController);
//# sourceMappingURL=inbox.controller.js.map