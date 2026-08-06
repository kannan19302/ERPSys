import { Module } from "@nestjs/common";
import { ExtensionRegistryController } from "./extension-registry.controller";
import { ExtensionRegistryService } from "./extension-registry.service";
import { ExtensionSchemaService } from "./extension-schema.service";
import { ExtensionSignatureService } from "./extension-signature.service";

@Module({
  controllers: [ExtensionRegistryController],
  providers: [
    ExtensionRegistryService,
    ExtensionSchemaService,
    ExtensionSignatureService,
  ],
  exports: [
    ExtensionRegistryService,
    ExtensionSchemaService,
    ExtensionSignatureService,
  ],
})
export class ExtensionRegistryModule {}
