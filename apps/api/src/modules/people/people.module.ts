// @ts-nocheck
import { PeopleGeneratedController } from "./people-generated.controller";
import { PeopleGeneratedService } from "./people-generated.service";
import { Module } from "@nestjs/common";
import { PeopleController } from "./people.controller";
import { PeopleService } from "./people.service";
import { PeopleCompetenciesService } from "./people-competencies.service";
import { PeopleSuccessionService } from "./people-succession.service";

@Module({
  controllers: [PeopleGeneratedController, PeopleController],
  providers: [
    PeopleGeneratedService,
    PeopleService,
    PeopleCompetenciesService,
    PeopleSuccessionService,
  ],
  exports: [
    PeopleGeneratedService,
    PeopleService,
    PeopleCompetenciesService,
    PeopleSuccessionService,
  ],
})
export class PeopleModule {}
