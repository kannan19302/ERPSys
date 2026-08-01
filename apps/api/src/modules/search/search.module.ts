import { SearchGeneratedController } from "./search-generated.controller";
import { SearchGeneratedService } from "./search-generated.service";
import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { SearchConfigService } from "./search-config.service";
import { SearchSynonymsService } from "./search-synonyms.service";

@Module({
  controllers: [SearchGeneratedController, SearchController],
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
