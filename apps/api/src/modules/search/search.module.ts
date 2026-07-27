import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { SearchConfigService } from "./search-config.service";
import { SearchSynonymsService } from "./search-synonyms.service";

@Module({
  controllers: [SearchController],
  providers: [SearchService, SearchConfigService, SearchSynonymsService],
  exports: [SearchService, SearchConfigService, SearchSynonymsService],
})
export class SearchModule {}
