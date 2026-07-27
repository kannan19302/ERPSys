import { Module } from "@nestjs/common";
import { PwaController } from "./pwa.controller";
import { PwaService } from "./pwa.service";
import { PwaPushService } from "./pwa-push.service";
import { PwaSyncService } from "./pwa-sync.service";

@Module({
  controllers: [PwaController],
  providers: [PwaService, PwaPushService, PwaSyncService],
  exports: [PwaService, PwaPushService, PwaSyncService],
})
export class PwaModule {}
