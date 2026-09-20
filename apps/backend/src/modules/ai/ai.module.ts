import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiRequest } from './entities/ai-request.entity';
import { Lead } from '../lead/entities/lead.entity';
import { LeadActivity } from '../lead/entities/lead-activity.entity';
import { AiService } from './services/ai.service';
import { AiController } from './controllers/ai.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AiRequest, Lead, LeadActivity])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
