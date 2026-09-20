import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplate } from './entities/email-template.entity';
import { Campaign } from './entities/campaign.entity';
import { CampaignStep } from './entities/campaign-step.entity';
import { CampaignMember } from './entities/campaign-member.entity';
import { Lead } from '../lead/entities/lead.entity';
import { LeadActivity } from '../lead/entities/lead-activity.entity';
import { EmailProviderService } from './services/email-provider.service';
import { CampaignService } from './services/campaign.service';
import { CampaignController } from './controllers/campaign.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailTemplate,
      Campaign,
      CampaignStep,
      CampaignMember,
      Lead,
      LeadActivity,
    ]),
  ],
  controllers: [CampaignController],
  providers: [EmailProviderService, CampaignService],
  exports: [EmailProviderService, CampaignService],
})
export class CampaignModule {}
