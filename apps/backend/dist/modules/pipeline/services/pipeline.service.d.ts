import { Repository } from 'typeorm';
import { PipelineStage } from '../entities/pipeline-stage.entity';
export declare class PipelineService {
    private readonly stageRepository;
    constructor(stageRepository: Repository<PipelineStage>);
    findStages(tenantId: string): Promise<PipelineStage[]>;
    createStage(tenantId: string, name: string, color: string, probability?: number): Promise<PipelineStage>;
    private seedDefaultStages;
}
