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
exports.PipelineStage = void 0;
const typeorm_1 = require("typeorm");
let PipelineStage = class PipelineStage {
};
exports.PipelineStage = PipelineStage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PipelineStage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PipelineStage.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], PipelineStage.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '#1976d2' }),
    __metadata("design:type", String)
], PipelineStage.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PipelineStage.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', default: 10 }),
    __metadata("design:type", Number)
], PipelineStage.prototype, "probability", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PipelineStage.prototype, "is_won", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PipelineStage.prototype, "is_lost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], PipelineStage.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], PipelineStage.prototype, "created_at", void 0);
exports.PipelineStage = PipelineStage = __decorate([
    (0, typeorm_1.Entity)('pipeline_stages')
], PipelineStage);
//# sourceMappingURL=pipeline-stage.entity.js.map