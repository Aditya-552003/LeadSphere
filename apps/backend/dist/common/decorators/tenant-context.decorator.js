"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContext = void 0;
const common_1 = require("@nestjs/common");
exports.TenantContext = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext;
});
//# sourceMappingURL=tenant-context.decorator.js.map