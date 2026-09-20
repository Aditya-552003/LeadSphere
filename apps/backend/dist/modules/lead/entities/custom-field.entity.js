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
exports.CustomField = exports.CustomFieldType = void 0;
const typeorm_1 = require("typeorm");
var CustomFieldType;
(function (CustomFieldType) {
    CustomFieldType["TEXT"] = "text";
    CustomFieldType["LONGTEXT"] = "longtext";
    CustomFieldType["NUMBER"] = "number";
    CustomFieldType["DECIMAL"] = "decimal";
    CustomFieldType["CURRENCY"] = "currency";
    CustomFieldType["DATE"] = "date";
    CustomFieldType["DATETIME"] = "datetime";
    CustomFieldType["BOOLEAN"] = "boolean";
    CustomFieldType["SELECT"] = "select";
    CustomFieldType["MULTISELECT"] = "multiselect";
    CustomFieldType["URL"] = "url";
    CustomFieldType["EMAIL"] = "email";
    CustomFieldType["PHONE"] = "phone";
})(CustomFieldType || (exports.CustomFieldType = CustomFieldType = {}));
let CustomField = class CustomField {
};
exports.CustomField = CustomField;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomField.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], CustomField.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'lead' }),
    __metadata("design:type", String)
], CustomField.prototype, "entity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CustomField.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CustomField.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: CustomFieldType.TEXT }),
    __metadata("design:type", String)
], CustomField.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], CustomField.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], CustomField.prototype, "required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CustomField.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], CustomField.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CustomField.prototype, "created_at", void 0);
exports.CustomField = CustomField = __decorate([
    (0, typeorm_1.Entity)('custom_fields'),
    (0, typeorm_1.Unique)(['tenant_id', 'entity', 'key'])
], CustomField);
//# sourceMappingURL=custom-field.entity.js.map