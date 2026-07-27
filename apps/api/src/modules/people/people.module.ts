import { Module } from "@nestjs/common";
import { PeopleController } from "./people.controller";
import { PeopleService } from "./people.service";
import { PeopleCompetenciesService } from "./people-competencies.service";
import { PeopleSuccessionService } from "./people-succession.service";

@Module({
  controllers: [PeopleController],
  providers: [
    PeopleService,
    PeopleCompetenciesService,
    PeopleSuccessionService,
  ],
  exports: [PeopleService, PeopleCompetenciesService, PeopleSuccessionService],
})
export class PeopleModule {}
