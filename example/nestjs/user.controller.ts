import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common'
import { UserService } from './user.service'

@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  findAll() {
    return this.users.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.users.findOne(id)
  }

  @Get(':id/missing')
  findMissing(@Param('id', ParseIntPipe) id: number) {
    return this.users.findOne(id + 100)
  }

  @Post()
  create(@Body() body: { name: string; role: string }) {
    return this.users.create(body.name, body.role)
  }
}
