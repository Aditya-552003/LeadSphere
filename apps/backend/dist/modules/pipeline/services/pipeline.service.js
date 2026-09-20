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
exports.PipelineService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pipeline_stage_entity_1 = require("../entities/pipeline-stage.entity");
const DEFAULT_STAGES = [
    { name: 'New', color: '#3b82f6', position: 1, probability: 10 },
    { name: 'Contacted', color: '#06b6d4', position: 2, probability: 20 },
    { name: 'Interested', color: '#8b5cf6', position: 3, probability: 40 },
    { name: 'Meeting', color: '#f59e0b', position: 4, probability: 60 },
    { name: 'Proposal', color: '#ec4899', position: 5, probability: 80 },
    { name: 'Won', color: '#10b981', position: 6, probability: 100, is_won: true },
    { name: 'Lost', color: '#ef4444', position: 7, probability: 0, is_lost: true },
];
let PipelineService = class PipelineService {
    constructor(stageRepository) {
        this.stageRepository = stageRepository;
    }
    async findStages(tenantId) {
        let stages = await this.stageRepository.find({
            where: { tenant_id: tenantId, is_active: true },
            order: { position: 'ASC' },
        });
        if (stages.length === 0) {
            stages = await this.seedDefaultStages(tenantId);
        }
        return stages;
    }
    async createStage(tenantId, name, color, probability = 10) {
        const count = await this.stageRepository.count({ where: { tenant_id: tenantId } });
        const stage = this.stageRepository.create({
            tenant_id: tenantId,
            name,
            color,
            position: count + 1,
            probability,
        });
        return this.stageRepository.save(stage);
    }
    async seedDefaultStages(tenantId) {
        const stages = DEFAULT_STAGES.map((s) => this.stageRepository.create({ ...s, tenant_id: tenantId }));
        return this.stageRepository.save(stages);
    }
};
exports.PipelineService = PipelineService;
exports.PipelineService = PipelineService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pipeline_stage_entity_1.PipelineStage)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PipelineService);
//# sourceMappingURL=pipeline.service.js.map