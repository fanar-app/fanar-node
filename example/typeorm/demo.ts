/**
 * TypeORM demo — FanarTypeOrmLogger with in-memory SQLite
 *
 * Setup:
 *   cd example && npm install
 * Run:
 *   npm run typeorm
 *
 * Open the Fanar desktop app first — every query appears there in real time.
 */

import 'reflect-metadata'
import { Column, DataSource, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from 'typeorm'
import { FanarTypeOrmLogger } from 'fanar/nestjs'
import fanar from 'fanar'

fanar.configure({ port: 6061 })

// ── Entities ──────────────────────────────────────────────────────────────────

@Entity()
class User {
  @PrimaryGeneratedColumn() id!: number
  @Column() name!: string
  @OneToMany(() => Order, o => o.user) orders!: Order[]
}

@Entity()
class Order {
  @PrimaryGeneratedColumn() id!: number
  @Column() product!: string
  @Column('float') total!: number
  @Column() userId!: number
  @ManyToOne(() => User, u => u.orders) @JoinColumn({ name: 'userId' }) user!: User
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const ds = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [User, Order],
    synchronize: true,
    logging: ['query'],
    logger: new FanarTypeOrmLogger(),
  })

  await ds.initialize()

  const userRepo = ds.getRepository(User)
  const orderRepo = ds.getRepository(Order)

  console.log('\n══════════════════════════════════════════')
  console.log('  Fanar TypeORM demo — check the desktop app')
  console.log('══════════════════════════════════════════\n')

  // Seed — runs outside fanar.run() so these show as ungrouped
  const [alice, bob] = await userRepo.save([{ name: 'Alice' }, { name: 'Bob' }])
  await orderRepo.save([
    { product: 'Laptop', total: 1299, userId: alice.id },
    { product: 'Mouse',  total: 49,   userId: alice.id },
    { product: 'Desk',   total: 599,  userId: bob.id },
  ])

  // Scenario 1 — grouped under a single request ID via fanar.run()
  console.log('→ Scenario 1: fetch all orders with their users')
  await fanar.run(async () => {
    const orders = await orderRepo.find({ relations: ['user'] })
    fanar(orders).label('orders with users')
  })

  // Scenario 2 — separate request context
  console.log('→ Scenario 2: fetch a single user with their orders')
  await fanar.run(async () => {
    const user = await userRepo.findOne({ where: { id: alice.id }, relations: ['orders'] })
    fanar(user).label('alice with orders')
  })

  // Scenario 3 — exception in a request context
  console.log('→ Scenario 3: error mid-request')
  await fanar.run(async () => {
    try {
      await userRepo.findOneOrFail({ where: { id: 9999 } })
    } catch (err) {
      fanar(err as Error)
    }
  })

  console.log('\n3 request groups sent. Each shows up in Fanar with:')
  console.log('  • query payloads  — every SQL statement with bindings')
  console.log('  • object payloads — from manual fanar() calls')
  console.log('  • request groups  — grouped by request ID\n')

  await ds.destroy()
}

main().catch(console.error)
