import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { Tenant } from './modules/tenant/entities/tenant.entity';
import { User } from './modules/user/entities/user.entity';
import { Membership } from './modules/user/entities/membership.entity';
import { Invitation } from './modules/user/entities/invitation.entity';
import { Session } from './modules/auth/entities/session.entity';
import { Role } from './modules/rbac/entities/role.entity';
import { Permission } from './modules/rbac/entities/permission.entity';
import { RolePermission } from './modules/rbac/entities/role-permission.entity';
import { Group } from './modules/rbac/entities/group.entity';
import { GroupMember } from './modules/rbac/entities/group-member.entity';
import { PermissionOverride } from './modules/rbac/entities/permission-override.entity';
import { AuditLog } from './modules/audit/entities/audit-log.entity';
import { Lead } from './modules/lead/entities/lead.entity';
import { CustomField } from './modules/lead/entities/custom-field.entity';
import { Tag } from './modules/lead/entities/tag.entity';
import { LeadTag } from './modules/lead/entities/lead-tag.entity';
import { LeadNote } from './modules/lead/entities/lead-note.entity';
import { LeadActivity } from './modules/lead/entities/lead-activity.entity';
import { PipelineStage } from './modules/pipeline/entities/pipeline-stage.entity';
import { ImportJob } from './modules/data/entities/import-job.entity';
import { ExportJob } from './modules/data/entities/export-job.entity';
import { Followup } from './modules/followup/entities/followup.entity';
import { EmailTemplate } from './modules/campaign/entities/email-template.entity';
import { Campaign } from './modules/campaign/entities/campaign.entity';
import { CampaignStep } from './modules/campaign/entities/campaign-step.entity';
import { CampaignMember } from './modules/campaign/entities/campaign-member.entity';
import { Conversation } from './modules/inbox/entities/conversation.entity';
import { Message } from './modules/inbox/entities/message.entity';
import { AiRequest } from './modules/ai/entities/ai-request.entity';
import { AnalyticsDaily } from './modules/analytics/entities/analytics-daily.entity';
import { Document } from './modules/document/entities/document.entity';
import { DocumentVersion } from './modules/document/entities/document-version.entity';

import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AuditModule } from './modules/audit/audit.module';
import { LeadModule } from './modules/lead/lead.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { ImportExportModule } from './modules/data/import-export.module';
import { FollowupModule } from './modules/followup/followup.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { AiModule } from './modules/ai/ai.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DocumentModule } from './modules/document/document.module';

import { AppController } from './app.controller';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from './modules/auth/guards/tenant.guard';
import { PermissionGuard } from './modules/auth/guards/permission.guard';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isSslRequired =
          process.env.DB_SSL === 'true' ||
          process.env.NODE_ENV === 'production' ||
          Boolean(process.env.DATABASE_URL);

        const commonOptions = {
          ssl: isSslRequired ? { rejectUnauthorized: false } : false,
          synchronize: true,
          logging: process.env.NODE_ENV === 'development',
          retryAttempts: 3,
          retryDelay: 1000,
          entities: [
            Tenant,
            User,
            Membership,
            Invitation,
            Session,
            Role,
            Permission,
            RolePermission,
            Group,
            GroupMember,
            PermissionOverride,
            AuditLog,
            Lead,
            CustomField,
            Tag,
            LeadTag,
            LeadNote,
            LeadActivity,
            PipelineStage,
            ImportJob,
            ExportJob,
            Followup,
            EmailTemplate,
            Campaign,
            CampaignStep,
            CampaignMember,
            Conversation,
            Message,
            AiRequest,
            AnalyticsDaily,
            Document,
            DocumentVersion,
          ],
        };

        if (process.env.DATABASE_URL) {
          return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ...commonOptions,
          };
        }

        return {
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'leadsphere',
          ...commonOptions,
        };
      },
    }),
    AuthModule,
    TenantModule,
    UserModule,
    RbacModule,
    AuditModule,
    LeadModule,
    PipelineModule,
    ImportExportModule,
    FollowupModule,
    CampaignModule,
    InboxModule,
    AiModule,
    AnalyticsModule,
    DocumentModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
  ],
})
export class AppModule {}
