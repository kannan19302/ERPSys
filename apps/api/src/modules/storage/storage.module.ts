import { Module } from "@nestjs/common";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";
import { StorageBucketsService } from "./storage-buckets.service";
import { StoragePoliciesService } from "./storage-policies.service";

@Module({
  controllers: [StorageController],
  providers: [StorageService, StorageBucketsService, StoragePoliciesService],
  exports: [StorageService, StorageBucketsService, StoragePoliciesService],
})
export class StorageModule {}
