import { Module } from "@nestjs/common";
import { DriveController } from "./drive.controller";
import { DocumentsService } from "./documents.service";
import { SignatureWorkflowService } from "./services/signature-workflow.service";
import { PlatformCredentialsModule } from "../../common/platform-credentials/platform-credentials.module";

@Module({
  imports: [PlatformCredentialsModule],
  controllers: [DriveController],
  providers: [DocumentsService, SignatureWorkflowService],
  exports: [DocumentsService, SignatureWorkflowService],
})
export class DocumentsModule {}
