import { Module } from "@nestjs/common";
import { SavedViewsController } from "./saved-views.controller";
import { SavedViewsService } from "./saved-views.service";
import { SavedViewsDeepService } from "./saved-views-deep.service";

@Module({
  controllers: [SavedViewsController],
  providers: [SavedViewsService, SavedViewsDeepService],
  exports: [SavedViewsService, SavedViewsDeepService],
})
export class SavedViewsModule {}
