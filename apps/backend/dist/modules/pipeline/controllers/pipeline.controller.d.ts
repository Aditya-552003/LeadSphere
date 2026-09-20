import { PipelineService } from '../services/pipeline.service';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';
export declare class PipelineController {
    private readonly pipelineService;
    constructor(pipelineService: PipelineService);
    findStages(ctx: ITenantContext): Promise<{
        data: import("../entities/pipeline-stage.entity").PipelineStage[];
    }>;
    createStage(ctx: ITenantContext, body: {
        name: string;
        color: string;
        probability?: number;
    }): Promise<{
        data: import("../entities/pipeline-stage.entity").PipelineStage;
    }>;
}
