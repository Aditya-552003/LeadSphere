import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestId = (request.headers['x-request-id'] as string) || 'req_unknown';

    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected internal error occurred.';
    let details: any[] = [];

    if (exception instanceof HttpException) {
      const resPayload: any = exception.getResponse();
      if (typeof resPayload === 'object' && resPayload !== null) {
        message = resPayload.message || exception.message;
        code = resPayload.error || this.getErrorCodeFromStatus(status);
        if (Array.isArray(resPayload.message)) {
          details = resPayload.message.map((msg: string) => ({ issue: msg }));
          message = 'Validation failed for one or more fields.';
          code = 'VALIDATION_ERROR';
        }
      } else {
        message = resPayload || exception.message;
        code = this.getErrorCodeFromStatus(status);
      }
    } else if (exception instanceof Error) {
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

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED: return 'UNAUTHENTICATED';
      case HttpStatus.FORBIDDEN: return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND: return 'NOT_FOUND';
      case HttpStatus.CONFLICT: return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY: return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS: return 'RATE_LIMITED';
      default: return 'INTERNAL_ERROR';
    }
  }
}
