// @ts-nocheck
import { SearchGeneratedController } from "./search-generated.controller";
import { SearchGeneratedService } from "./search-generated.service";
import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { SearchConfigService } from "./search-config.service";
import { SearchSynonymsService } from "./search-synonyms.service";
import { SearchDeepController } from "./search-deep.controller";
import { SearchDeepService } from "./search-deep.service";
import { SearchDeepV2Controller } from "./search-deep-v2.controller";
import { SearchDeepV2Service } from "./search-deep-v2.service";
import { SearchDeepV3Controller } from "./search-deep-v3.controller";
import { SearchDeepV3Service } from "./search-deep-v3.service";

@Module({
  controllers: [
    SearchGeneratedController,
    SearchController,
  ],
  providers: [
    SearchGeneratedService,
    SearchService,
    SearchConfigService,
    SearchSynonymsService,
  ],
  exports: [
    SearchGeneratedService,
    SearchService,
    SearchConfigService,
    SearchSynonymsService,
  ],
})
export class SearchModule {}
