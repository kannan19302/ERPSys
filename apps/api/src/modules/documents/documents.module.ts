import { Module } from "@nestjs/common";
import { DriveController } from "./drive.controller";
import { DocumentsService } from "./documents.service";
import { DocumentsDeepController } from "./documents-deep.controller";
import { DocumentsDeepService } from "./documents-deep.service";
import { SignatureWorkflowService } from "./services/signature-workflow.service";
import { PlatformCredentialsModule } from "../../common/platform-credentials/platform-credentials.module";

@Module({
  imports: [PlatformCredentialsModule],
  controllers: [DriveController, DocumentsDeepController],
  providers: [DocumentsService, DocumentsDeepService, SignatureWorkflowService],
  exports: [DocumentsService, DocumentsDeepService, SignatureWorkflowService],
})
export class DocumentsModule {}
