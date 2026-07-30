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
    LocalizationController,
    LocalizationDeepController,
    LocalizationBulkController,
  ],
  providers: [
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
  exports: [LocalizationService],
})
export class LocalizationModule {}
