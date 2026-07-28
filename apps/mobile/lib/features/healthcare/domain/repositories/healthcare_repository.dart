import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/healthcare.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class HealthcareRepository {
  Future<Result<Cacheable<Paginated<Patient>>>> listPatients(ListQuery query);
  Future<Result<Patient>> getPatient(String id);
  Future<Result<Patient>> createPatient(Map<String, dynamic> payload);
  Future<Result<Patient>> updatePatient(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePatient(String id);

  Future<Result<Cacheable<Paginated<Appointment>>>> listAppointments(ListQuery query);
  Future<Result<Appointment>> getAppointment(String id);
  Future<Result<Appointment>> createAppointment(Map<String, dynamic> payload);
  Future<Result<Appointment>> updateAppointment(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteAppointment(String id);

  Future<Result<Cacheable<Paginated<Prescription>>>> listPrescriptions(ListQuery query);
  Future<Result<Prescription>> getPrescription(String id);
  Future<Result<Prescription>> createPrescription(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<LabOrder>>>> listLabOrders(ListQuery query);
  Future<Result<LabOrder>> getLabOrder(String id);
  Future<Result<LabOrder>> createLabOrder(Map<String, dynamic> payload);
  Future<Result<LabOrder>> updateLabOrderResult(String id, Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<MedicalRecord>>>> listMedicalRecords(ListQuery query);
  Future<Result<MedicalRecord>> getMedicalRecord(String id);
  Future<Result<MedicalRecord>> createMedicalRecord(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<InsuranceClaim>>>> listInsuranceClaims(ListQuery query);
  Future<Result<InsuranceClaim>> getInsuranceClaim(String id);
  Future<Result<InsuranceClaim>> createInsuranceClaim(Map<String, dynamic> payload);
  Future<Result<InsuranceClaim>> updateInsuranceClaim(String id, Map<String, dynamic> payload);
  Future<Result<InsuranceClaim>> submitInsuranceClaim(String id);
  Future<Result<InsuranceClaim>> approveInsuranceClaim(String id);
  Future<Result<InsuranceClaim>> rejectInsuranceClaim(String id);
}
