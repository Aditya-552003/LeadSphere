"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportExportModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const import_job_entity_1 = require("./entities/import-job.entity");
const export_job_entity_1 = require("./entities/export-job.entity");
const lead_entity_1 = require("../lead/entities/lead.entity");
const lead_activity_entity_1 = require("../lead/entities/lead-activity.entity");
const import_export_service_1 = require("./services/import-export.service");
const import_export_controller_1 = require("./controllers/import-export.controller");
let ImportExportModule = class ImportExportModule {
};
exports.ImportExportModule = ImportExportModule;
exports.ImportExportModule = ImportExportModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([import_job_entity_1.ImportJob, export_job_entity_1.ExportJob, lead_entity_1.Lead, lead_activity_entity_1.LeadActivity])],
        controllers: [import_export_controller_1.ImportExportController],
        providers: [import_export_service_1.ImportExportService],
        exports: [import_export_service_1.ImportExportService],
    })
], ImportExportModule);
//# sourceMappingURL=import-export.module.js.map