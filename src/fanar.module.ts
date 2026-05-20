import { Module, DynamicModule, Global, InjectionToken } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { FanarInterceptor, FANAR_OPTIONS } from './fanar.interceptor'
import { configure as configureClient } from './client'

export { FANAR_OPTIONS }

export interface FanarModuleOptions {
  enabled?: boolean
  host?: string
  port?: number
}

@Global()
@Module({})
export class FanarModule {
  static forRoot(options: FanarModuleOptions = {}): DynamicModule {
    if (options.host !== undefined || options.port !== undefined) {
      configureClient({ host: options.host, port: options.port })
    }
    return {
      module: FanarModule,
      providers: [
        { provide: FANAR_OPTIONS, useValue: options },
        { provide: APP_INTERCEPTOR, useClass: FanarInterceptor },
      ],
    }
  }

  static forRootAsync(options: {
    imports?: DynamicModule['imports']
    useFactory: (...args: unknown[]) => FanarModuleOptions | Promise<FanarModuleOptions>
    inject?: InjectionToken[]
  }): DynamicModule {
    return {
      module: FanarModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: FANAR_OPTIONS,
          useFactory: async (...args: unknown[]) => {
            const opts = await options.useFactory(...args)
            if (opts.host !== undefined || opts.port !== undefined) {
              configureClient({ host: opts.host, port: opts.port })
            }
            return opts
          },
          inject: options.inject ?? [],
        },
        { provide: APP_INTERCEPTOR, useClass: FanarInterceptor },
      ],
    }
  }
}
