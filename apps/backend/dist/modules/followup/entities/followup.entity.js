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
exports.Followup = exports.FollowupRecurrence = exports.FollowupStatus = exports.FollowupPriority = void 0;
const typeorm_1 = require("typeorm");
const lead_entity_1 = require("../../lead/entities/lead.entity");
var FollowupPriority;
(function (FollowupPriority) {
    FollowupPriority["LOW"] = "low";
    FollowupPriority["MEDIUM"] = "medium";
    FollowupPriority["HIGH"] = "high";
    FollowupPriority["URGENT"] = "urgent";
})(FollowupPriority || (exports.FollowupPriority = FollowupPriority = {}));
var FollowupStatus;
(function (FollowupStatus) {
    FollowupStatus["PENDING"] = "pending";
    FollowupStatus["COMPLETED"] = "completed";
    FollowupStatus["SNOOZED"] = "snoozed";
    FollowupStatus["CANCELLED"] = "cancelled";
})(FollowupStatus || (exports.FollowupStatus = FollowupStatus = {}));
var FollowupRecurrence;
(function (FollowupRecurrence) {
    FollowupRecurrence["NONE"] = "none";
    FollowupRecurrence["DAILY"] = "daily";
    FollowupRecurrence["WEEKLY"] = "weekly";
    FollowupRecurrence["MONTHLY"] = "monthly";
})(FollowupRecurrence || (exports.FollowupRecurrence = FollowupRecurrence = {}));
let Followup = class Followup {
};
exports.Followup = Followup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Followup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Followup.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Followup.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Followup.prototype, "assigned_to", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Followup.prototype, "lead_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lead_entity_1.Lead, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'lead_id' }),
    __metadata("design:type", lead_entity_1.Lead)
], Followup.prototype, "lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Followup.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Followup.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Followup.prototype, "due_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, default: 'UTC' }),
    __metadata("design:type", String)
], Followup.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: FollowupPriority, default: FollowupPriority.MEDIUM }),
    __metadata("design:type", String)
], Followup.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: FollowupStatus, default: FollowupStatus.PENDING }),
    __metadata("design:type", String)
], Followup.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Followup.prototype, "snoozed_until", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Followup.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: FollowupRecurrence, default: FollowupRecurrence.NONE }),
    __metadata("design:type", String)
], Followup.prototype, "recurrence", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Followup.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Followup.prototype, "updated_at", void 0);
exports.Followup = Followup = __decorate([
    (0, typeorm_1.Entity)('followups'),
    (0, typeorm_1.Index)(['tenant_id', 'due_at']),
    (0, typeorm_1.Index)(['tenant_id', 'status'])
], Followup);
//# sourceMappingURL=followup.entity.js.map