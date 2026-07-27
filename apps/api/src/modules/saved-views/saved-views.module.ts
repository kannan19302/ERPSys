import { Module } from "@nestjs/common";
import { SavedViewsController } from "./saved-views.controller";
import { SavedViewsService } from "./saved-views.service";
import { SavedViewsDeepService } from "./saved-views-deep.service";
import { SavedViewsSharingService } from "./saved-views-sharing.service";
import { SavedViewsFiltersService } from "./saved-views-filters.service";

@Module({
  controllers: [SavedViewsController],
  providers: [
    SavedViewsService,
    SavedViewsDeepService,
    SavedViewsSharingService,
    SavedViewsFiltersService,
  ],
  exports: [
    SavedViewsService,
    SavedViewsDeepService,
    SavedViewsSharingService,
    SavedViewsFiltersService,
  ],
})
export class SavedViewsModule {}
