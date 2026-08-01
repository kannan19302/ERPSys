import { Module } from "@nestjs/common";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";
import { StorageBucketsService } from "./storage-buckets.service";
import { StoragePoliciesService } from "./storage-policies.service";
import { StorageAdvancedController } from "./storage-advanced.controller";
import { StorageAdvancedService } from "./storage-advanced.service";
import { StorageExpansionController } from "./storage-expansion.controller";
import { StorageExtController } from "./storage-ext.controller";

@Module({
  controllers: [
    StorageController,
    StorageAdvancedController,
    StorageExpansionController,
    StorageExtController,
  ],
  providers: [
    StorageService,
    StorageBucketsService,
    StoragePoliciesService,
    StorageAdvancedService,
  ],
  exports: [
    StorageService,
    StorageBucketsService,
    StoragePoliciesService,
    StorageAdvancedService,
  ],
})
export class StorageModule {}
