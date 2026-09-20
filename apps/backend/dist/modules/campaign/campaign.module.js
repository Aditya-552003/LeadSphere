"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const email_template_entity_1 = require("./entities/email-template.entity");
const campaign_entity_1 = require("./entities/campaign.entity");
const campaign_step_entity_1 = require("./entities/campaign-step.entity");
const campaign_member_entity_1 = require("./entities/campaign-member.entity");
const lead_entity_1 = require("../lead/entities/lead.entity");
const lead_activity_entity_1 = require("../lead/entities/lead-activity.entity");
const email_provider_service_1 = require("./services/email-provider.service");
const campaign_service_1 = require("./services/campaign.service");
const campaign_controller_1 = require("./controllers/campaign.controller");
let CampaignModule = class CampaignModule {
};
exports.CampaignModule = CampaignModule;
exports.CampaignModule = CampaignModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                email_template_entity_1.EmailTemplate,
                campaign_entity_1.Campaign,
                campaign_step_entity_1.CampaignStep,
                campaign_member_entity_1.CampaignMember,
                lead_entity_1.Lead,
                lead_activity_entity_1.LeadActivity,
            ]),
        ],
        controllers: [campaign_controller_1.CampaignController],
        providers: [email_provider_service_1.EmailProviderService, campaign_service_1.CampaignService],
        exports: [email_provider_service_1.EmailProviderService, campaign_service_1.CampaignService],
    })
], CampaignModule);
//# sourceMappingURL=campaign.module.js.map