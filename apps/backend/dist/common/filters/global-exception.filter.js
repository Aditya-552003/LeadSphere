"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const requestId = request.headers['x-request-id'] || 'req_unknown';
        let code = 'INTERNAL_ERROR';
        let message = 'An unexpected internal error occurred.';
        let details = [];
        if (exception instanceof common_1.HttpException) {
            const resPayload = exception.getResponse();
            if (typeof resPayload === 'object' && resPayload !== null) {
                message = resPayload.message || exception.message;
                code = resPayload.error || this.getErrorCodeFromStatus(status);
                if (Array.isArray(resPayload.message)) {
                    details = resPayload.message.map((msg) => ({ issue: msg }));
                    message = 'Validation failed for one or more fields.';
                    code = 'VALIDATION_ERROR';
                }
            }
            else {
                message = resPayload || exception.message;
                code = this.getErrorCodeFromStatus(status);
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        response.status(status).json({
            error: {
                code,
                message,
                details,
                request_id: requestId,
            },
        });
    }
    getErrorCodeFromStatus(status) {
        switch (status) {
            case common_1.HttpStatus.UNAUTHORIZED: return 'UNAUTHENTICATED';
            case common_1.HttpStatus.FORBIDDEN: return 'FORBIDDEN';
            case common_1.HttpStatus.NOT_FOUND: return 'NOT_FOUND';
            case common_1.HttpStatus.CONFLICT: return 'CONFLICT';
            case common_1.HttpStatus.UNPROCESSABLE_ENTITY: return 'VALIDATION_ERROR';
            case common_1.HttpStatus.TOO_MANY_REQUESTS: return 'RATE_LIMITED';
            default: return 'INTERNAL_ERROR';
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map