/**
 * NestJS demo — global interceptor, @Fanar() decorator, manual fanar() calls
 *
 * Setup:
 *   cd example && npm install
 * Run:
 *   npm run nestjs
 *
 * Open the Fanar desktop app first — payloads appear there in real time.
 */

import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import supertest from 'supertest'

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false })
  await app.init()
  const http = app.getHttpServer()

  console.log('\n══════════════════════════════════════════')
  console.log('  Fanar NestJS demo — check the desktop app')
  console.log('══════════════════════════════════════════\n')

  console.log('→ GET /users (list all users + @Fanar() trace)')
  await supertest(http).get('/users')

  console.log('→ GET /users/2 (single user + @Fanar() trace)')
  await supertest(http).get('/users/2')

  console.log('→ POST /users (create user + manual fanar() call)')
  await supertest(http).post('/users').send({ name: 'Dave', role: 'user' })

  console.log('→ GET /users/1/missing (triggers NotFoundException)')
  await supertest(http).get('/users/1/missing')

  console.log('\n4 requests sent. Each shows up in Fanar as:')
  console.log('  • request summary  — method, path, status, duration')
  console.log('  • object payloads  — from manual fanar() calls')
  console.log('  • method traces    — from @Fanar() decorator\n')

  await app.close()
}

main().catch(console.error)
