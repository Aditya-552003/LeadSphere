import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Lead } from '../lead/entities/lead.entity';
import { LeadActivity } from '../lead/entities/lead-activity.entity';
import { WhatsAppService } from './services/whatsapp.service';
import { InboxService } from './services/inbox.service';
import { InboxController } from './controllers/inbox.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, Lead, LeadActivity])],
  controllers: [InboxController],
  providers: [WhatsAppService, InboxService],
  exports: [WhatsAppService, InboxService],
})
export class InboxModule {}
