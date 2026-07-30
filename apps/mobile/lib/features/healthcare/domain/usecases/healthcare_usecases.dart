import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/healthcare.dart';
import '../repositories/healthcare_repository.dart';

class ListPatientsUseCase extends UseCase<Cacheable<Paginated<Patient>>, ListQuery> {
  const ListPatientsUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Patient>>>> call(ListQuery params) =>
      _repository.listPatients(params);
}

class GetPatientUseCase extends UseCase<Patient, String> {
  const GetPatientUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Patient>> call(String id) => _repository.getPatient(id);
}

class SavePatientParams {
  const SavePatientParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SavePatientUseCase extends UseCase<Patient, SavePatientParams> {
  const SavePatientUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Patient>> call(SavePatientParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPatient(params.payload)
        : _repository.updatePatient(id, params.payload);
  }
}

class DeletePatientUseCase extends UseCase<void, String> {
  const DeletePatientUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deletePatient(id);
}

class ListAppointmentsUseCase extends UseCase<Cacheable<Paginated<Appointment>>, ListQuery> {
  const ListAppointmentsUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Appointment>>>> call(ListQuery params) =>
      _repository.listAppointments(params);
}

class GetAppointmentUseCase extends UseCase<Appointment, String> {
  const GetAppointmentUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Appointment>> call(String id) => _repository.getAppointment(id);
}

class SaveAppointmentParams {
  const SaveAppointmentParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveAppointmentUseCase extends UseCase<Appointment, SaveAppointmentParams> {
  const SaveAppointmentUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Appointment>> call(SaveAppointmentParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createAppointment(params.payload)
        : _repository.updateAppointment(id, params.payload);
  }
}

class DeleteAppointmentUseCase extends UseCase<void, String> {
  const DeleteAppointmentUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteAppointment(id);
}

class ListPrescriptionsUseCase extends UseCase<Cacheable<Paginated<Prescription>>, ListQuery> {
  const ListPrescriptionsUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Prescription>>>> call(ListQuery params) =>
      _repository.listPrescriptions(params);
}

class ListLabOrdersUseCase extends UseCase<Cacheable<Paginated<LabOrder>>, ListQuery> {
  const ListLabOrdersUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<LabOrder>>>> call(ListQuery params) =>
      _repository.listLabOrders(params);
}

class ListMedicalRecordsUseCase extends UseCase<Cacheable<Paginated<MedicalRecord>>, ListQuery> {
  const ListMedicalRecordsUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<MedicalRecord>>>> call(ListQuery params) =>
      _repository.listMedicalRecords(params);
}

class GetPrescriptionUseCase extends UseCase<Prescription, String> {
  const GetPrescriptionUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Prescription>> call(String id) =>
      _repository.getPrescription(id);
}

class SavePrescriptionParams {
  const SavePrescriptionParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SavePrescriptionUseCase
    extends UseCase<Prescription, SavePrescriptionParams> {
  const SavePrescriptionUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Prescription>> call(SavePrescriptionParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPrescription(params.payload)
        : _repository.updatePrescription(id, params.payload);
  }
}

class GetLabOrderUseCase extends UseCase<LabOrder, String> {
  const GetLabOrderUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<LabOrder>> call(String id) =>
      _repository.getLabOrder(id);
}

class SaveLabOrderParams {
  const SaveLabOrderParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveLabOrderUseCase
    extends UseCase<LabOrder, SaveLabOrderParams> {
  const SaveLabOrderUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<LabOrder>> call(SaveLabOrderParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createLabOrder(params.payload)
        : _repository.updateLabOrderResult(id, params.payload);
  }
}

class ListInsuranceClaimsUseCase extends UseCase<Cacheable<Paginated<InsuranceClaim>>, ListQuery> {
  const ListInsuranceClaimsUseCase(this._repository);
  final HealthcareRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<InsuranceClaim>>>> call(ListQuery params) =>
      _repository.listInsuranceClaims(params);
}
