import { send } from './client'
import { buildPayload } from './payload'

export function Fanar(): MethodDecorator {
  return (_target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => unknown
    const methodName = String(propertyKey)

    descriptor.value = function (...args: unknown[]) {
      const start = Date.now()

      const report = (result?: unknown, error?: unknown) =>
        send(buildPayload('object', {
          method: methodName,
          args,
          ...(error !== undefined ? { error: error instanceof Error ? error.message : String(error) } : { result }),
          duration: Date.now() - start,
        }))

      let value: unknown
      try {
        value = original.apply(this, args)
      } catch (err) {
        report(undefined, err)
        throw err
      }

      if (value instanceof Promise) {
        return value.then(
          (v: unknown) => { report(v); return v },
          (err: unknown) => { report(undefined, err); throw err },
        )
      }

      if (value !== null && typeof value === 'object' && Symbol.asyncIterator in (value as object)) {
        const iter = value as AsyncGenerator<unknown>
        async function* wrapped(): AsyncGenerator<unknown> {
          let incoming: unknown
          try {
            for (;;) {
              const step = await iter.next(incoming)
              if (step.done) { report(step.value); return step.value }
              incoming = yield step.value
            }
          } catch (err) {
            report(undefined, err)
            throw err
          }
        }
        return wrapped()
      }

      report(value)
      return value
    }

    return descriptor
  }
}
