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
exports.CampaignStep = exports.CampaignStepType = void 0;
const typeorm_1 = require("typeorm");
const campaign_entity_1 = require("./campaign.entity");
const email_template_entity_1 = require("./email-template.entity");
var CampaignStepType;
(function (CampaignStepType) {
    CampaignStepType["SEND_EMAIL"] = "send_email";
    CampaignStepType["WAIT_DAYS"] = "wait_days";
})(CampaignStepType || (exports.CampaignStepType = CampaignStepType = {}));
let CampaignStep = class CampaignStep {
};
exports.CampaignStep = CampaignStep;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CampaignStep.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], CampaignStep.prototype, "campaign_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => campaign_entity_1.Campaign, (campaign) => campaign.steps, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'campaign_id' }),
    __metadata("design:type", campaign_entity_1.Campaign)
], CampaignStep.prototype, "campaign", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], CampaignStep.prototype, "step_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CampaignStepType, default: CampaignStepType.SEND_EMAIL }),
    __metadata("design:type", String)
], CampaignStep.prototype, "step_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CampaignStep.prototype, "template_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => email_template_entity_1.EmailTemplate, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'template_id' }),
    __metadata("design:type", email_template_entity_1.EmailTemplate)
], CampaignStep.prototype, "template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CampaignStep.prototype, "wait_days", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], CampaignStep.prototype, "subject_override", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CampaignStep.prototype, "created_at", void 0);
exports.CampaignStep = CampaignStep = __decorate([
    (0, typeorm_1.Entity)('campaign_steps')
], CampaignStep);
//# sourceMappingURL=campaign-step.entity.js.map