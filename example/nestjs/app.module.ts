import { Module } from "@nestjs/common";
import { FanarModule } from "fanar/nestjs";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [FanarModule.forRoot({ enabled: true, port: 6061 })],
  controllers: [UserController],
  providers: [UserService],
})
export class AppModule {}
