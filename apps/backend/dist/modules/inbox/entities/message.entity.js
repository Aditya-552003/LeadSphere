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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.DeliveryStatus = exports.MessageDirection = exports.SenderType = void 0;
const typeorm_1 = require("typeorm");
const conversation_entity_1 = require("./conversation.entity");
const lead_entity_1 = require("../../lead/entities/lead.entity");
const inbox_enums_1 = require("../enums/inbox.enums");
Object.defineProperty(exports, "SenderType", { enumerable: true, get: function () { return inbox_enums_1.SenderType; } });
Object.defineProperty(exports, "MessageDirection", { enumerable: true, get: function () { return inbox_enums_1.MessageDirection; } });
Object.defineProperty(exports, "DeliveryStatus", { enumerable: true, get: function () { return inbox_enums_1.DeliveryStatus; } });
let Message = class Message {
};
exports.Message = Message;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Message.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Message.prototype, "conversation_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => conversation_entity_1.Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'conversation_id' }),
    __metadata("design:type", conversation_entity_1.Conversation)
], Message.prototype, "conversation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Message.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "lead_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lead_entity_1.Lead, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'lead_id' }),
    __metadata("design:type", lead_entity_1.Lead)
], Message.prototype, "lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: inbox_enums_1.SenderType, default: inbox_enums_1.SenderType.USER }),
    __metadata("design:type", String)
], Message.prototype, "sender_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "sender_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: inbox_enums_1.ConversationChannel, default: inbox_enums_1.ConversationChannel.EMAIL }),
    __metadata("design:type", String)
], Message.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: inbox_enums_1.MessageDirection, default: inbox_enums_1.MessageDirection.OUTBOUND }),
    __metadata("design:type", String)
], Message.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Message.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "media_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: inbox_enums_1.DeliveryStatus, default: inbox_enums_1.DeliveryStatus.SENT }),
    __metadata("design:type", String)
], Message.prototype, "delivery_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "whatsapp_message_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Message.prototype, "created_at", void 0);
exports.Message = Message = __decorate([
    (0, typeorm_1.Entity)('messages'),
    (0, typeorm_1.Index)(['conversation_id', 'created_at'])
], Message);
//# sourceMappingURL=message.entity.js.map