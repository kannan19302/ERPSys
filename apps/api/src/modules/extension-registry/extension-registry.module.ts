import { Module } from "@nestjs/common";
import { ExtensionRegistryController } from "./extension-registry.controller";
import { ExtensionRegistryService } from "./extension-registry.service";

@Module({
  controllers: [ExtensionRegistryController],
  providers: [ExtensionRegistryService],
  exports: [ExtensionRegistryService],
})
export class ExtensionRegistryModule {}
