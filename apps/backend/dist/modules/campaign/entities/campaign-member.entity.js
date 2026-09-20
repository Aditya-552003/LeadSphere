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
exports.CampaignMember = exports.CampaignMemberStatus = void 0;
const typeorm_1 = require("typeorm");
const campaign_entity_1 = require("./campaign.entity");
const lead_entity_1 = require("../../lead/entities/lead.entity");
var CampaignMemberStatus;
(function (CampaignMemberStatus) {
    CampaignMemberStatus["ACTIVE"] = "active";
    CampaignMemberStatus["PAUSED"] = "paused";
    CampaignMemberStatus["COMPLETED"] = "completed";
    CampaignMemberStatus["REPLIED"] = "replied";
    CampaignMemberStatus["UNSUBSCRIBED"] = "unsubscribed";
})(CampaignMemberStatus || (exports.CampaignMemberStatus = CampaignMemberStatus = {}));
let CampaignMember = class CampaignMember {
};
exports.CampaignMember = CampaignMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CampaignMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], CampaignMember.prototype, "campaign_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => campaign_entity_1.Campaign, (campaign) => campaign.members, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'campaign_id' }),
    __metadata("design:type", campaign_entity_1.Campaign)
], CampaignMember.prototype, "campaign", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], CampaignMember.prototype, "lead_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lead_entity_1.Lead, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'lead_id' }),
    __metadata("design:type", lead_entity_1.Lead)
], CampaignMember.prototype, "lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CampaignMemberStatus, default: CampaignMemberStatus.ACTIVE }),
    __metadata("design:type", String)
], CampaignMember.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], CampaignMember.prototype, "current_step_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], CampaignMember.prototype, "next_action_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], CampaignMember.prototype, "last_sent_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CampaignMember.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CampaignMember.prototype, "updated_at", void 0);
exports.CampaignMember = CampaignMember = __decorate([
    (0, typeorm_1.Entity)('campaign_members'),
    (0, typeorm_1.Index)(['campaign_id', 'lead_id'], { unique: true })
], CampaignMember);
//# sourceMappingURL=campaign-member.entity.js.map