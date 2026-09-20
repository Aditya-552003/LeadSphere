"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const lead_entity_1 = require("./entities/lead.entity");
const custom_field_entity_1 = require("./entities/custom-field.entity");
const tag_entity_1 = require("./entities/tag.entity");
const lead_tag_entity_1 = require("./entities/lead-tag.entity");
const lead_note_entity_1 = require("./entities/lead-note.entity");
const lead_activity_entity_1 = require("./entities/lead-activity.entity");
const lead_service_1 = require("./services/lead.service");
const lead_controller_1 = require("./controllers/lead.controller");
const audit_module_1 = require("../audit/audit.module");
let LeadModule = class LeadModule {
};
exports.LeadModule = LeadModule;
exports.LeadModule = LeadModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([lead_entity_1.Lead, custom_field_entity_1.CustomField, tag_entity_1.Tag, lead_tag_entity_1.LeadTag, lead_note_entity_1.LeadNote, lead_activity_entity_1.LeadActivity]),
            audit_module_1.AuditModule,
        ],
        controllers: [lead_controller_1.LeadController],
        providers: [lead_service_1.LeadService],
        exports: [lead_service_1.LeadService],
    })
], LeadModule);
//# sourceMappingURL=lead.module.js.map