"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportJob = exports.ExportStatus = void 0;
const typeorm_1 = require("typeorm");
var ExportStatus;
(function (ExportStatus) {
    ExportStatus["PENDING"] = "pending";
    ExportStatus["PROCESSING"] = "processing";
    ExportStatus["COMPLETED"] = "completed";
    ExportStatus["FAILED"] = "failed";
})(ExportStatus || (exports.ExportStatus = ExportStatus = {}));
let ExportJob = class ExportJob {
};
exports.ExportJob = ExportJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExportJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ExportJob.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ExportJob.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'csv' }),
    __metadata("design:type", String)
], ExportJob.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ExportJob.prototype, "total_records", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ExportStatus, default: ExportStatus.PENDING }),
    __metadata("design:type", String)
], ExportJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ExportJob.prototype, "file_url", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ExportJob.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ExportJob.prototype, "updated_at", void 0);
exports.ExportJob = ExportJob = __decorate([
    (0, typeorm_1.Entity)('export_jobs'),
    (0, typeorm_1.Index)(['tenant_id', 'created_at'])
], ExportJob);
//# sourceMappingURL=export-job.entity.js.map