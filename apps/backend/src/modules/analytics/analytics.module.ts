import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsDaily } from './entities/analytics-daily.entity';
import { Lead } from '../lead/entities/lead.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { Message } from '../inbox/entities/message.entity';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsDaily, Lead, Campaign, Message])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
