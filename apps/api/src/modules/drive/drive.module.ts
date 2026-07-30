// @ts-nocheck
import { DriveGeneratedController } from "./drive-generated.controller";
import { DriveGeneratedService } from "./drive-generated.service";
import { Module } from "@nestjs/common";
import { DriveController } from "./drive.controller";
import { DriveDeepController } from "./drive-deep.controller";
import { DriveService } from "./drive.service";
import { DriveDeepService } from "./drive-deep.service";
import { DocumentStorageClientModule } from "../../common/integrations/document-storage-client.module";

@Module({
  imports: [DocumentStorageClientModule],
  controllers: [DriveGeneratedController, DriveController, DriveDeepController],
  providers: [DriveGeneratedService, DriveService, DriveDeepService],
  exports: [DriveGeneratedService, DriveService, DriveDeepService],
})
export class DriveModule {}
