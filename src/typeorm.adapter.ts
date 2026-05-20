import type { Logger, QueryRunner } from 'typeorm'
import { send } from './client'
import { buildPayload } from './payload'
import { incrementQueryCount } from './request-context'

// TypeORM's Logger interface does not provide duration in logQuery.
// Duration is available only for slow queries via logQuerySlow, but since
// logQuery fires for all queries (including slow ones), we log here with
// duration: 0 to get full coverage without duplicates.
export class FanarTypeOrmLogger implements Logger {
  logQuery(query: string, parameters?: unknown[], _queryRunner?: QueryRunner): void {
    incrementQueryCount()
    send(buildPayload('query', { sql: query, bindings: parameters ?? null, duration: 0 }))
  }

  logQueryError(_error: string | Error, _query: string, _parameters?: unknown[], _queryRunner?: QueryRunner): void {}
  logQuerySlow(_time: number, _query: string, _parameters?: unknown[], _queryRunner?: QueryRunner): void {}
  logSchemaBuild(_message: string, _queryRunner?: QueryRunner): void {}
  logMigration(_message: string, _queryRunner?: QueryRunner): void {}
  log(_level: 'log' | 'info' | 'warn', _message: unknown, _queryRunner?: QueryRunner): void {}
}
