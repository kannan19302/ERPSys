import { LocalizationGeneratedController } from "./localization-generated.controller";
import { LocalizationGeneratedService } from "./localization-generated.service";
import { Module } from "@nestjs/common";
import { LocalizationController } from "./localization.controller";
import { LocalizationDeepController } from "./localization-deep.controller";
import { LocalizationBulkController } from "./localization-bulk.controller";
import { LocalizationService } from "./localization.service";
import { LocalizationContextService } from "./localization-context.service";
import { LocalizationGlossaryService } from "./localization-glossary.service";
import { LocalizationMemoryService } from "./localization-memory.service";
import { LocalizationMachineTranslationService } from "./localization-mt.service";
import { LocalizationReviewService } from "./localization-review.service";
import { LocalizationFallbackService } from "./localization-fallback.service";
import { LocalizationContentScheduleService } from "./localization-content-schedule.service";
import { LocalizationRegionValidationService } from "./localization-region-validation.service";

@Module({
  controllers: [
    LocalizationGeneratedController,
    LocalizationController,
    LocalizationDeepController,
    LocalizationBulkController,
  ],
  providers: [
    LocalizationGeneratedService,
    LocalizationService,
    LocalizationContextService,
    LocalizationGlossaryService,
    LocalizationMemoryService,
    LocalizationMachineTranslationService,
    LocalizationReviewService,
    LocalizationFallbackService,
    LocalizationContentScheduleService,
    LocalizationRegionValidationService,
  ],
  exports: [LocalizationGeneratedService, LocalizationService],
})
export class LocalizationModule {}
