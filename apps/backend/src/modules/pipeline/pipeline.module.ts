import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { PipelineService } from './services/pipeline.service';
import { PipelineController } from './controllers/pipeline.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PipelineStage])],
  controllers: [PipelineController],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
