import { Injectable, NotFoundException } from '@nestjs/common'
import { Fanar } from 'fanar/nestjs'
import fanar from 'fanar'

const db = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Carol', role: 'user' },
]

@Injectable()
export class UserService {
  @Fanar()
  findAll() {
    fanar(db).label('users from db')
    return db
  }

  @Fanar()
  findOne(id: number) {
    const user = db.find(u => u.id === id)
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return user
  }

  @Fanar()
  async create(name: string, role: string) {
    const user = { id: db.length + 1, name, role }
    db.push(user)
    fanar(user).label('user created')
    return user
  }
}
