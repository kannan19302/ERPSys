// @ts-nocheck
import { Module } from "@nestjs/common";
import { DriveController } from "./drive.controller";
import { DocumentsService } from "./documents.service";
import { DocumentsDeepController } from "./documents-deep.controller";
import { DocumentsDeepService } from "./documents-deep.service";
import { DocumentsAdvancedController } from "./documents-advanced.controller";
import { DocumentsAdvancedService } from "./documents-advanced.service";
import { DocumentsExpansionController } from "./documents-expansion.controller";
import { DocumentsExtController } from "./documents-ext.controller";
import { SignatureWorkflowService } from "./services/signature-workflow.service";
import { PlatformCredentialsModule } from "../../common/platform-credentials/platform-credentials.module";

@Module({
  imports: [PlatformCredentialsModule],
  controllers: [
    DriveController,
    DocumentsDeepController,
    DocumentsAdvancedController,
    DocumentsExpansionController,
    DocumentsExtController,
  ],
  providers: [
    DocumentsService,
    DocumentsDeepService,
    DocumentsAdvancedService,
    SignatureWorkflowService,
  ],
  exports: [
    DocumentsService,
    DocumentsDeepService,
    DocumentsAdvancedService,
    SignatureWorkflowService,
  ],
})
export class DocumentsModule {}
