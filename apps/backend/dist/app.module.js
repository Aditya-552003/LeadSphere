"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const tenant_entity_1 = require("./modules/tenant/entities/tenant.entity");
const user_entity_1 = require("./modules/user/entities/user.entity");
const membership_entity_1 = require("./modules/user/entities/membership.entity");
const invitation_entity_1 = require("./modules/user/entities/invitation.entity");
const session_entity_1 = require("./modules/auth/entities/session.entity");
const role_entity_1 = require("./modules/rbac/entities/role.entity");
const permission_entity_1 = require("./modules/rbac/entities/permission.entity");
const role_permission_entity_1 = require("./modules/rbac/entities/role-permission.entity");
const group_entity_1 = require("./modules/rbac/entities/group.entity");
const group_member_entity_1 = require("./modules/rbac/entities/group-member.entity");
const permission_override_entity_1 = require("./modules/rbac/entities/permission-override.entity");
const audit_log_entity_1 = require("./modules/audit/entities/audit-log.entity");
const lead_entity_1 = require("./modules/lead/entities/lead.entity");
const custom_field_entity_1 = require("./modules/lead/entities/custom-field.entity");
const tag_entity_1 = require("./modules/lead/entities/tag.entity");
const lead_tag_entity_1 = require("./modules/lead/entities/lead-tag.entity");
const lead_note_entity_1 = require("./modules/lead/entities/lead-note.entity");
const lead_activity_entity_1 = require("./modules/lead/entities/lead-activity.entity");
const pipeline_stage_entity_1 = require("./modules/pipeline/entities/pipeline-stage.entity");
const import_job_entity_1 = require("./modules/data/entities/import-job.entity");
const export_job_entity_1 = require("./modules/data/entities/export-job.entity");
const followup_entity_1 = require("./modules/followup/entities/followup.entity");
const email_template_entity_1 = require("./modules/campaign/entities/email-template.entity");
const campaign_entity_1 = require("./modules/campaign/entities/campaign.entity");
const campaign_step_entity_1 = require("./modules/campaign/entities/campaign-step.entity");
const campaign_member_entity_1 = require("./modules/campaign/entities/campaign-member.entity");
const conversation_entity_1 = require("./modules/inbox/entities/conversation.entity");
const message_entity_1 = require("./modules/inbox/entities/message.entity");
const ai_request_entity_1 = require("./modules/ai/entities/ai-request.entity");
const analytics_daily_entity_1 = require("./modules/analytics/entities/analytics-daily.entity");
const document_entity_1 = require("./modules/document/entities/document.entity");
const document_version_entity_1 = require("./modules/document/entities/document-version.entity");
const auth_module_1 = require("./modules/auth/auth.module");
const tenant_module_1 = require("./modules/tenant/tenant.module");
const user_module_1 = require("./modules/user/user.module");
const rbac_module_1 = require("./modules/rbac/rbac.module");
const audit_module_1 = require("./modules/audit/audit.module");
const lead_module_1 = require("./modules/lead/lead.module");
const pipeline_module_1 = require("./modules/pipeline/pipeline.module");
const import_export_module_1 = require("./modules/data/import-export.module");
const followup_module_1 = require("./modules/followup/followup.module");
const campaign_module_1 = require("./modules/campaign/campaign.module");
const inbox_module_1 = require("./modules/inbox/inbox.module");
const ai_module_1 = require("./modules/ai/ai.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const document_module_1 = require("./modules/document/document.module");
const app_controller_1 = require("./app.controller");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const jwt_auth_guard_1 = require("./modules/auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("./modules/auth/guards/tenant.guard");
const permission_guard_1 = require("./modules/auth/guards/permission.guard");
const tenant_context_interceptor_1 = require("./common/interceptors/tenant-context.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [app_controller_1.AppController],
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: () => ({
                    type: 'postgres',
                    host: process.env.DB_HOST || 'localhost',
                    port: parseInt(process.env.DB_PORT || '5432', 10),
                    username: process.env.DB_USERNAME || 'postgres',
                    password: process.env.DB_PASSWORD || 'postgres',
                    database: process.env.DB_DATABASE || 'leadsphere',
                    entities: [
                        tenant_entity_1.Tenant,
                        user_entity_1.User,
                        membership_entity_1.Membership,
                        invitation_entity_1.Invitation,
                        session_entity_1.Session,
                        role_entity_1.Role,
                        permission_entity_1.Permission,
                        role_permission_entity_1.RolePermission,
                        group_entity_1.Group,
                        group_member_entity_1.GroupMember,
                        permission_override_entity_1.PermissionOverride,
                        audit_log_entity_1.AuditLog,
                        lead_entity_1.Lead,
                        custom_field_entity_1.CustomField,
                        tag_entity_1.Tag,
                        lead_tag_entity_1.LeadTag,
                        lead_note_entity_1.LeadNote,
                        lead_activity_entity_1.LeadActivity,
                        pipeline_stage_entity_1.PipelineStage,
                        import_job_entity_1.ImportJob,
                        export_job_entity_1.ExportJob,
                        followup_entity_1.Followup,
                        email_template_entity_1.EmailTemplate,
                        campaign_entity_1.Campaign,
                        campaign_step_entity_1.CampaignStep,
                        campaign_member_entity_1.CampaignMember,
                        conversation_entity_1.Conversation,
                        message_entity_1.Message,
                        ai_request_entity_1.AiRequest,
                        analytics_daily_entity_1.AnalyticsDaily,
                        document_entity_1.Document,
                        document_version_entity_1.DocumentVersion,
                    ],
                    synchronize: true,
                    logging: process.env.NODE_ENV === 'development',
                    retryAttempts: 2,
                    retryDelay: 1000,
                }),
            }),
            auth_module_1.AuthModule,
            tenant_module_1.TenantModule,
            user_module_1.UserModule,
            rbac_module_1.RbacModule,
            audit_module_1.AuditModule,
            lead_module_1.LeadModule,
            pipeline_module_1.PipelineModule,
            import_export_module_1.ImportExportModule,
            followup_module_1.FollowupModule,
            campaign_module_1.CampaignModule,
            inbox_module_1.InboxModule,
            ai_module_1.AiModule,
            analytics_module_1.AnalyticsModule,
            document_module_1.DocumentModule,
        ],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: tenant_guard_1.TenantGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permission_guard_1.PermissionGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: tenant_context_interceptor_1.TenantContextInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map