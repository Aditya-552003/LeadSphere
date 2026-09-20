import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PipelineStage } from '../entities/pipeline-stage.entity';

const DEFAULT_STAGES = [
  { name: 'New', color: '#3b82f6', position: 1, probability: 10 },
  { name: 'Contacted', color: '#06b6d4', position: 2, probability: 20 },
  { name: 'Interested', color: '#8b5cf6', position: 3, probability: 40 },
  { name: 'Meeting', color: '#f59e0b', position: 4, probability: 60 },
  { name: 'Proposal', color: '#ec4899', position: 5, probability: 80 },
  { name: 'Won', color: '#10b981', position: 6, probability: 100, is_won: true },
  { name: 'Lost', color: '#ef4444', position: 7, probability: 0, is_lost: true },
];

@Injectable()
export class PipelineService {
  constructor(
    @InjectRepository(PipelineStage)
    private readonly stageRepository: Repository<PipelineStage>,
  ) {}

  async findStages(tenantId: string) {
    let stages = await this.stageRepository.find({
      where: { tenant_id: tenantId, is_active: true },
      order: { position: 'ASC' },
    });

    if (stages.length === 0) {
      stages = await this.seedDefaultStages(tenantId);
    }

    return stages;
  }

  async createStage(tenantId: string, name: string, color: string, probability = 10) {
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

  private async seedDefaultStages(tenantId: string) {
    const stages = DEFAULT_STAGES.map((s) =>
      this.stageRepository.create({ ...s, tenant_id: tenantId }),
    );
    return this.stageRepository.save(stages);
  }
}
