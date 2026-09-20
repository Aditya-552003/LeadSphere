"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowupModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const followup_entity_1 = require("./entities/followup.entity");
const lead_activity_entity_1 = require("../lead/entities/lead-activity.entity");
const followup_service_1 = require("./services/followup.service");
const followup_controller_1 = require("./controllers/followup.controller");
let FollowupModule = class FollowupModule {
};
exports.FollowupModule = FollowupModule;
exports.FollowupModule = FollowupModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([followup_entity_1.Followup, lead_activity_entity_1.LeadActivity])],
        controllers: [followup_controller_1.FollowupController],
        providers: [followup_service_1.FollowupService],
        exports: [followup_service_1.FollowupService],
    })
], FollowupModule);
//# sourceMappingURL=followup.module.js.map