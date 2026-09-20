import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantContext = request.tenantContext;

    // If request is public or no tenant context present, proceed normally
    if (!tenantContext || !tenantContext.tenantId) {
      return next.handle();
    }

    const queryRunner = this.dataSource.createQueryRunner();

    return from(queryRunner.connect()).pipe(
      mergeMap(() => from(queryRunner.startTransaction())),
      mergeMap(() =>
        from(
          Promise.all([
            queryRunner.query(`SET LOCAL app.tenant_id = '${tenantContext.tenantId}'`),
            queryRunner.query(`SET LOCAL app.user_id = '${tenantContext.userId}'`),
          ]),
        ),
      ),
      mergeMap(() => {
        request.entityManager = queryRunner.manager;
        return next.handle().pipe(
          mergeMap(async (result) => {
            await queryRunner.commitTransaction();
            await queryRunner.release();
            return result;
          }),
        );
      }),
    );
  }
}
