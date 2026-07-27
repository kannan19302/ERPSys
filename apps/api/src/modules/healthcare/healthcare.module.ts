import { Module } from "@nestjs/common";
import { HealthcareController } from "./healthcare.controller";
import { HealthcareService } from "./healthcare.service";
import { HealthcareDeepController } from "./healthcare-deep.controller";
import { HealthcarePatientsService } from "./services/patients.service";
import { HealthcareAppointmentsService } from "./services/appointments.service";
import { HealthcarePrescriptionsService } from "./services/prescriptions.service";
import { HealthcareLabService } from "./services/lab.service";
import { HealthcareInsuranceService } from "./services/insurance.service";
import { HealthcarePharmacyService } from "./services/pharmacy.service";
import { HealthcareSchedulesService } from "./services/schedules.service";

@Module({
  controllers: [HealthcareController, HealthcareDeepController],
  providers: [
    HealthcareService,
    HealthcarePatientsService,
    HealthcareAppointmentsService,
    HealthcarePrescriptionsService,
    HealthcareLabService,
    HealthcareInsuranceService,
    HealthcarePharmacyService,
    HealthcareSchedulesService,
  ],
  exports: [HealthcareService],
})
export class HealthcareModule {}
