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
exports.AiRequest = exports.AiActionType = void 0;
const typeorm_1 = require("typeorm");
var AiActionType;
(function (AiActionType) {
    AiActionType["SUMMARIZE_LEAD"] = "summarize_lead";
    AiActionType["DRAFT_EMAIL"] = "draft_email";
    AiActionType["CLASSIFY_SENTIMENT"] = "classify_sentiment";
    AiActionType["SUGGEST_NEXT_STEP"] = "suggest_next_step";
})(AiActionType || (exports.AiActionType = AiActionType = {}));
let AiRequest = class AiRequest {
};
exports.AiRequest = AiRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AiRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AiRequest.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], AiRequest.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AiActionType }),
    __metadata("design:type", String)
], AiRequest.prototype, "action_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AiRequest.prototype, "prompt_tokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AiRequest.prototype, "completion_tokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, default: 'gpt-4o-mini' }),
    __metadata("design:type", String)
], AiRequest.prototype, "model_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, default: 'AI-generated — verify before send' }),
    __metadata("design:type", String)
], AiRequest.prototype, "disclaimer_label", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], AiRequest.prototype, "created_at", void 0);
exports.AiRequest = AiRequest = __decorate([
    (0, typeorm_1.Entity)('ai_requests'),
    (0, typeorm_1.Index)(['tenant_id', 'created_at'])
], AiRequest);
//# sourceMappingURL=ai-request.entity.js.map