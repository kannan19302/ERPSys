// @ts-nocheck
import { PwaGeneratedController } from "./pwa-generated.controller";
import { PwaGeneratedService } from "./pwa-generated.service";
import { Module } from "@nestjs/common";
import { PwaController } from "./pwa.controller";
import { PwaService } from "./pwa.service";
import { PwaPushService } from "./pwa-push.service";
import { PwaSyncService } from "./pwa-sync.service";

@Module({
  controllers: [PwaGeneratedController, PwaController],
  providers: [PwaGeneratedService, PwaService, PwaPushService, PwaSyncService],
  exports: [PwaGeneratedService, PwaService, PwaPushService, PwaSyncService],
})
export class PwaModule {}
