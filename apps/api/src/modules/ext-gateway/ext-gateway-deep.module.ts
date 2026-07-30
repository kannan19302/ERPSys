// @ts-nocheck
import { Module } from "@nestjs/common";
import { ExtGatewayDeepController } from "./ext-gateway-deep.controller";
import { ExtGatewayDeepService } from "./ext-gateway-deep.service";

@Module({
  controllers: [ExtGatewayDeepController],
  providers: [ExtGatewayDeepService],
  exports: [ExtGatewayDeepService],
})
export class ExtGatewayDeepModule {}
