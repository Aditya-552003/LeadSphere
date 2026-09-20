import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Followup } from './entities/followup.entity';
import { LeadActivity } from '../lead/entities/lead-activity.entity';
import { FollowupService } from './services/followup.service';
import { FollowupController } from './controllers/followup.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Followup, LeadActivity])],
  controllers: [FollowupController],
  providers: [FollowupService],
  exports: [FollowupService],
})
export class FollowupModule {}
