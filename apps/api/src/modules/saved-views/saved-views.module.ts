import { SavedViewsGeneratedController } from "./saved-views-generated.controller";
import { SavedViewsGeneratedService } from "./saved-views-generated.service";
import { Module } from "@nestjs/common";
import { SavedViewsController } from "./saved-views.controller";
import { SavedViewsService } from "./saved-views.service";
import { SavedViewsDeepService } from "./saved-views-deep.service";
import { SavedViewsSharingService } from "./saved-views-sharing.service";
import { SavedViewsFiltersService } from "./saved-views-filters.service";

@Module({
  controllers: [SavedViewsGeneratedController, SavedViewsController],
  providers: [
    SavedViewsGeneratedService,
    SavedViewsService,
    SavedViewsDeepService,
    SavedViewsSharingService,
    SavedViewsFiltersService,
  ],
  exports: [
    SavedViewsGeneratedService,
    SavedViewsService,
    SavedViewsDeepService,
    SavedViewsSharingService,
    SavedViewsFiltersService,
  ],
})
export class SavedViewsModule {}
