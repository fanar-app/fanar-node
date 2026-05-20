import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Optional, Inject, HttpException } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { randomUUID } from 'crypto'
import { send } from './client'
import { runWithRequestId } from './context'
import { buildPayload } from './payload'
import { getQueryCount, runWithRequestState } from './request-context'
import type { FanarModuleOptions } from './fanar.module'

export const FANAR_OPTIONS = Symbol('FANAR_OPTIONS')

@Injectable()
export class FanarInterceptor implements NestInterceptor {
  constructor(@Optional() @Inject(FANAR_OPTIONS) private readonly opts?: FanarModuleOptions) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (this.opts?.enabled === false) return next.handle()

    const type = context.getType<string>()

    if (type === 'http')    return this._interceptHttp(context, next)
    if (type === 'ws')      return this._interceptWs(context, next)
    if (type === 'graphql') return this._interceptGraphql(context, next)
    return next.handle()
  }

  private _interceptHttp(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ method: string; path?: string; url: string; body?: unknown }>()
    const start = Date.now()
    const path = req.path ?? req.url
    const body = typeof req.body === 'object' && req.body !== null && Object.keys(req.body).length > 0 ? { body: req.body } : {}

    const sendPayload = (status: number) => {
      const payload = buildPayload('request', { method: req.method, path, status, duration: Date.now() - start, queryCount: getQueryCount(), ...body })
      payload.label = `${req.method} ${path}`
      send(payload)
    }

    return new Observable(observer => {
      runWithRequestId(randomUUID(), () => {
        runWithRequestState(() => {
          next.handle().pipe(
            tap({
              complete: () => {
                const res = context.switchToHttp().getResponse<{ statusCode: number }>()
                sendPayload(res.statusCode)
              },
              error: (err: unknown) => sendPayload(err instanceof HttpException ? err.getStatus() : 500),
            })
          ).subscribe(observer)
        })
      })
    })
  }

  private _interceptWs(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ws = context.switchToWs()
    const data = ws.getData<unknown>()
    const start = Date.now()

    return new Observable(observer => {
      runWithRequestId(randomUUID(), () => {
        runWithRequestState(() => {
          next.handle().pipe(
            tap({
              next: result => {
                const payload = buildPayload('request', {
                  method: 'WS',
                  path: '',
                  status: 200,
                  duration: Date.now() - start,
                  queryCount: getQueryCount(),
                  body: data,
                  result,
                })
                payload.label = `WS event`
                send(payload)
              },
              error: (err: unknown) => {
                const payload = buildPayload('request', {
                  method: 'WS',
                  path: '',
                  status: 500,
                  duration: Date.now() - start,
                  queryCount: getQueryCount(),
                  body: data,
                  error: err instanceof Error ? err.message : String(err),
                })
                payload.label = `WS event`
                send(payload)
              },
            })
          ).subscribe(observer)
        })
      })
    })
  }

  private _interceptGraphql(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    let operationName = 'unknown'
    let operationType = 'query'

    try {
      // GqlExecutionContext is an optional peer — require at runtime to avoid hard dependency
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GqlExecutionContext } = require('@nestjs/graphql') as {
        GqlExecutionContext: { create(ctx: ExecutionContext): { getInfo<T>(): T } }
      }
      const gqlCtx = GqlExecutionContext.create(context)
      const info = gqlCtx.getInfo<{ fieldName: string; operation: { operation: string } }>()
      operationName = info.fieldName
      operationType = info.operation.operation
    } catch (err) {
      if (err instanceof Error && !err.message.includes('Cannot find module')) {
        console.warn('[fanar] unexpected error resolving GraphQL context:', err)
      }
    }

    const start = Date.now()

    return new Observable(observer => {
      runWithRequestId(randomUUID(), () => {
        runWithRequestState(() => {
          next.handle().pipe(
            tap({
              next: result => {
                const payload = buildPayload('request', {
                  method: operationType.toUpperCase(),
                  path: operationName,
                  status: 200,
                  duration: Date.now() - start,
                  queryCount: getQueryCount(),
                  result,
                })
                payload.label = `GQL ${operationType} ${operationName}`
                send(payload)
              },
              error: (err: unknown) => {
                const payload = buildPayload('request', {
                  method: operationType.toUpperCase(),
                  path: operationName,
                  status: 500,
                  duration: Date.now() - start,
                  queryCount: getQueryCount(),
                  error: err instanceof Error ? err.message : String(err),
                })
                payload.label = `GQL ${operationType} ${operationName}`
                send(payload)
              },
            })
          ).subscribe(observer)
        })
      })
    })
  }
}
