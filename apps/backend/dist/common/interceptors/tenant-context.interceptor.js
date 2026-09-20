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
exports.TenantContextInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const typeorm_1 = require("typeorm");
let TenantContextInterceptor = class TenantContextInterceptor {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const tenantContext = request.tenantContext;
        if (!tenantContext || !tenantContext.tenantId) {
            return next.handle();
        }
        const queryRunner = this.dataSource.createQueryRunner();
        return (0, rxjs_1.from)(queryRunner.connect()).pipe((0, operators_1.mergeMap)(() => (0, rxjs_1.from)(queryRunner.startTransaction())), (0, operators_1.mergeMap)(() => (0, rxjs_1.from)(Promise.all([
            queryRunner.query(`SET LOCAL app.tenant_id = '${tenantContext.tenantId}'`),
            queryRunner.query(`SET LOCAL app.user_id = '${tenantContext.userId}'`),
        ]))), (0, operators_1.mergeMap)(() => {
            request.entityManager = queryRunner.manager;
            return next.handle().pipe((0, operators_1.mergeMap)(async (result) => {
                await queryRunner.commitTransaction();
                await queryRunner.release();
                return result;
            }));
        }));
    }
};
exports.TenantContextInterceptor = TenantContextInterceptor;
exports.TenantContextInterceptor = TenantContextInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], TenantContextInterceptor);
//# sourceMappingURL=tenant-context.interceptor.js.map