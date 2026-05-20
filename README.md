# fanar

> Debug receiver for Node.js — see what your app is doing, instantly.

Send any value from your Node.js app and watch it appear in the [Fanar desktop app](https://github.com/fanar-app/fanar-app) in real time. Zero dependencies. Works with plain Node, Express, Fastify, and NestJS.

---

## Install

```bash
npm install fanar
```

Requires the [Fanar desktop app](https://github.com/fanar-app/fanar-app/releases) running on your machine.

---

## Usage

```js
import fanar from 'fanar'

// Primitives
fanar('hello world')
fanar(42)
fanar(true)

// Objects — renders as a collapsible JSON tree
fanar({ user, orders, meta })

// Exceptions — renders with clickable stack frames that open in VS Code
fanar(new Error('something went wrong'))

// SQL queries — syntax highlighted, bindings listed, slow queries flagged red
fanar.query('SELECT * FROM users WHERE id = ?', { bindings: [userId], duration: 12 })

// Timers
const t = fanar.time('render')
// ... do work ...
t.stop()

// Named label and color for any payload
fanar(data).label('after transform').color('purple')

// Clear the desktop app
await fanar.clear()
```

---

## Request context

Automatically group all `fanar()` calls within a single request. Register the middleware once:

**Express / Fastify**

```js
app.use(fanar.middleware())
```

**Standalone (no HTTP framework)**

```js
fanar.run(() => {
  fanar('inside this closure — all calls share a request ID')
})
```

---

## NestJS

```ts
import { FanarModule, FanarTypeOrmLogger, withFanar, Fanar } from 'fanar/nestjs'
```

**Module setup:**

```ts
// Inline config
FanarModule.forRoot({ enabled: true, host: 'localhost', port: 23517 })

// From ConfigService
FanarModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    enabled: config.get('NODE_ENV') !== 'production',
  }),
  inject: [ConfigService],
})
```

Once imported, a global interceptor fires after every request and sends: method, path, status, duration, and query count.

**TypeORM — automatic query logging:**

```ts
// data-source.ts
import { FanarTypeOrmLogger } from 'fanar/nestjs'

export const AppDataSource = new DataSource({
  // ...
  logger: new FanarTypeOrmLogger(),
})
```

**Prisma — automatic query logging:**

```ts
import { withFanar } from 'fanar/nestjs'

export const prisma = withFanar(
  new PrismaClient({ log: [{ emit: 'event', level: 'query' }] })
)
```

**Method tracing:**

```ts
import { Fanar } from 'fanar/nestjs'

@Injectable()
export class OrderService {
  @Fanar()
  async createOrder(dto: CreateOrderDto) {
    // method name, args, return value, and duration sent automatically
  }
}
```

---

## Configuration

```js
fanar.configure({ host: 'localhost', port: 23517 })
```

Or set at startup — the desktop app also accepts `FANAR_PORT` as an environment variable.

---

## License

MIT
