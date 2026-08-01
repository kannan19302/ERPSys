import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/healthcare.dart';
import '../../domain/repositories/healthcare_repository.dart';
import '../datasources/healthcare_remote_data_source.dart';
import '../models/healthcare_models.dart';

class HealthcareRepositoryImpl implements HealthcareRepository {
  const HealthcareRepositoryImpl({
    required HealthcareRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _patientNamespace = 'healthcare.patients';
  static const String _appointmentNamespace = 'healthcare.appointments';
  static const String _prescriptionNamespace = 'healthcare.prescriptions';
  static const String _labOrderNamespace = 'healthcare.lab-orders';
  static const String _medicalRecordNamespace = 'healthcare.medical-records';
  static const String _insuranceClaimNamespace = 'healthcare.insurance-claims';

  final HealthcareRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final Paginated<T> page = await fetch();
      final List<Map<String, dynamic>> jsonItems = page.data
          .map((dynamic e) => (e as dynamic).toJson() as Map<String, dynamic>)
          .toList(growable: false);
      await _cache.write(_tenantId, namespace, query.cacheKey, <String, Object?>{
        'data': jsonItems,
        'meta': page.meta.toJson(),
      });
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: page),
      );
    } on NetworkException catch (error) {
      final cached = _cache.read<Map<String, dynamic>>(_tenantId, namespace, query.cacheKey);
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(cached.value, fromJson),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _single<T>(Future<T> Function() fetch) async {
    try {
      return Result<T>.ok(await fetch());
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _delete(Future<void> Function() action) async {
    try {
      await action();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _write<T>(Future<T> Function() action) async {
    try {
      final T result = await action();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<Patient>>>> listPatients(ListQuery q) =>
      _paginated(_patientNamespace, q, () => _remote.listPatients(q),
        PatientModel.fromJson,);

  @override
  Future<Result<Patient>> getPatient(String id) =>
      _single(() => _remote.getPatient(id));

  @override
  Future<Result<Patient>> createPatient(Map<String, dynamic> p) =>
      _write(() => _remote.createPatient(p));

  @override
  Future<Result<Patient>> updatePatient(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updatePatient(id, p));

  @override
  Future<Result<void>> deletePatient(String id) =>
      _delete(() => _remote.deletePatient(id));

  @override
  Future<Result<Cacheable<Paginated<Appointment>>>> listAppointments(ListQuery q) =>
      _paginated(_appointmentNamespace, q, () => _remote.listAppointments(q),
        AppointmentModel.fromJson,);

  @override
  Future<Result<Appointment>> getAppointment(String id) =>
      _single(() => _remote.getAppointment(id));

  @override
  Future<Result<Appointment>> createAppointment(Map<String, dynamic> p) =>
      _write(() => _remote.createAppointment(p));

  @override
  Future<Result<Appointment>> updateAppointment(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateAppointment(id, p));

  @override
  Future<Result<void>> deleteAppointment(String id) =>
      _delete(() => _remote.deleteAppointment(id));

  @override
  Future<Result<Cacheable<Paginated<Prescription>>>> listPrescriptions(ListQuery q) =>
      _paginated(_prescriptionNamespace, q, () => _remote.listPrescriptions(q),
        PrescriptionModel.fromJson,);

  @override
  Future<Result<Prescription>> getPrescription(String id) =>
      _single(() => _remote.getPrescription(id));

  @override
  Future<Result<Prescription>> createPrescription(Map<String, dynamic> p) =>
      _write(() => _remote.createPrescription(p));

  @override
  Future<Result<Cacheable<Paginated<LabOrder>>>> listLabOrders(ListQuery q) =>
      _paginated(_labOrderNamespace, q, () => _remote.listLabOrders(q),
        LabOrderModel.fromJson,);

  @override
  Future<Result<LabOrder>> getLabOrder(String id) =>
      _single(() => _remote.getLabOrder(id));

  @override
  Future<Result<LabOrder>> createLabOrder(Map<String, dynamic> p) =>
      _write(() => _remote.createLabOrder(p));

  @override
  Future<Result<LabOrder>> updateLabOrderResult(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateLabOrderResult(id, p));

  @override
  Future<Result<Cacheable<Paginated<MedicalRecord>>>> listMedicalRecords(ListQuery q) =>
      _paginated(_medicalRecordNamespace, q, () => _remote.listMedicalRecords(q),
        MedicalRecordModel.fromJson,);

  @override
  Future<Result<MedicalRecord>> getMedicalRecord(String id) =>
      _single(() => _remote.getMedicalRecord(id));

  @override
  Future<Result<MedicalRecord>> createMedicalRecord(Map<String, dynamic> p) =>
      _write(() => _remote.createMedicalRecord(p));

  @override
  Future<Result<Cacheable<Paginated<InsuranceClaim>>>> listInsuranceClaims(ListQuery q) =>
      _paginated(_insuranceClaimNamespace, q, () => _remote.listInsuranceClaims(q),
        InsuranceClaimModel.fromJson,);

  @override
  Future<Result<InsuranceClaim>> getInsuranceClaim(String id) =>
      _single(() => _remote.getInsuranceClaim(id));

  @override
  Future<Result<InsuranceClaim>> createInsuranceClaim(Map<String, dynamic> p) =>
      _write(() => _remote.createInsuranceClaim(p));

  @override
  Future<Result<InsuranceClaim>> updateInsuranceClaim(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateInsuranceClaim(id, p));

  @override
  Future<Result<InsuranceClaim>> submitInsuranceClaim(String id) =>
      _single(() => _remote.submitInsuranceClaim(id));

  @override
  Future<Result<InsuranceClaim>> approveInsuranceClaim(String id) =>
      _single(() => _remote.approveInsuranceClaim(id));

  @override
  Future<Result<InsuranceClaim>> rejectInsuranceClaim(String id) =>
      _single(() => _remote.rejectInsuranceClaim(id));

  @override
  Future<Result<Prescription>> updatePrescription(String id, Map<String, dynamic> p) async => throw UnimplementedError();

}
