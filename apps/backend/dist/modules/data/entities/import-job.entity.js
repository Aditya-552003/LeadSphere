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
exports.ImportJob = exports.ImportStatus = void 0;
const typeorm_1 = require("typeorm");
var ImportStatus;
(function (ImportStatus) {
    ImportStatus["PENDING"] = "pending";
    ImportStatus["PROCESSING"] = "processing";
    ImportStatus["COMPLETED"] = "completed";
    ImportStatus["FAILED"] = "failed";
})(ImportStatus || (exports.ImportStatus = ImportStatus = {}));
let ImportJob = class ImportJob {
};
exports.ImportJob = ImportJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ImportJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ImportJob.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ImportJob.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ImportJob.prototype, "filename", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ImportJob.prototype, "total_rows", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ImportJob.prototype, "processed_rows", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ImportJob.prototype, "successful_rows", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ImportJob.prototype, "failed_rows", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ImportJob.prototype, "duplicate_rows", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ImportStatus, default: ImportStatus.PENDING }),
    __metadata("design:type", String)
], ImportJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ImportJob.prototype, "column_mapping", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], ImportJob.prototype, "error_log", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ImportJob.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ImportJob.prototype, "updated_at", void 0);
exports.ImportJob = ImportJob = __decorate([
    (0, typeorm_1.Entity)('import_jobs'),
    (0, typeorm_1.Index)(['tenant_id', 'created_at'])
], ImportJob);
//# sourceMappingURL=import-job.entity.js.map