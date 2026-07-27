import { Module } from "@nestjs/common";
import { EducationController } from "./education.controller";
import { EducationService } from "./education.service";
import { EducationDeepController } from "./education-deep.controller";
import { EducationStudentsService } from "./services/students.service";
import { EducationCoursesService } from "./services/courses.service";
import { EducationGradesService } from "./services/grades.service";
import { EducationAttendanceService } from "./services/attendance.service";
import { EducationFeesService } from "./services/fees.service";
import { EducationLibraryService } from "./services/library.service";
import { EducationTimetableService } from "./services/timetable.service";
import { EducationExamsService } from "./services/exams.service";

@Module({
  controllers: [EducationController, EducationDeepController],
  providers: [
    EducationService,
    EducationStudentsService,
    EducationCoursesService,
    EducationGradesService,
    EducationAttendanceService,
    EducationFeesService,
    EducationLibraryService,
    EducationTimetableService,
    EducationExamsService,
  ],
  exports: [EducationService],
})
export class EducationModule {}
