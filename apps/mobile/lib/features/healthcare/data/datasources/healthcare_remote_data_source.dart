import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/healthcare_models.dart';

abstract class HealthcareRemoteDataSource {
  Future<Paginated<PatientModel>> listPatients(ListQuery query);
  Future<PatientModel> getPatient(String id);
  Future<PatientModel> createPatient(Map<String, dynamic> payload);
  Future<PatientModel> updatePatient(String id, Map<String, dynamic> payload);
  Future<void> deletePatient(String id);

  Future<Paginated<AppointmentModel>> listAppointments(ListQuery query);
  Future<AppointmentModel> getAppointment(String id);
  Future<AppointmentModel> createAppointment(Map<String, dynamic> payload);
  Future<AppointmentModel> updateAppointment(String id, Map<String, dynamic> payload);
  Future<void> deleteAppointment(String id);

  Future<Paginated<PrescriptionModel>> listPrescriptions(ListQuery query);
  Future<PrescriptionModel> getPrescription(String id);
  Future<PrescriptionModel> createPrescription(Map<String, dynamic> payload);

  Future<Paginated<LabOrderModel>> listLabOrders(ListQuery query);
  Future<LabOrderModel> getLabOrder(String id);
  Future<LabOrderModel> createLabOrder(Map<String, dynamic> payload);
  Future<LabOrderModel> updateLabOrderResult(String id, Map<String, dynamic> payload);

  Future<Paginated<MedicalRecordModel>> listMedicalRecords(ListQuery query);
  Future<MedicalRecordModel> getMedicalRecord(String id);
  Future<MedicalRecordModel> createMedicalRecord(Map<String, dynamic> payload);

  Future<Paginated<InsuranceClaimModel>> listInsuranceClaims(ListQuery query);
  Future<InsuranceClaimModel> getInsuranceClaim(String id);
  Future<InsuranceClaimModel> createInsuranceClaim(Map<String, dynamic> payload);
  Future<InsuranceClaimModel> updateInsuranceClaim(String id, Map<String, dynamic> payload);
  Future<InsuranceClaimModel> submitInsuranceClaim(String id);
  Future<InsuranceClaimModel> approveInsuranceClaim(String id);
  Future<InsuranceClaimModel> rejectInsuranceClaim(String id);
}

class HealthcareRemoteDataSourceImpl implements HealthcareRemoteDataSource {
  const HealthcareRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<PatientModel>> listPatients(ListQuery query) =>
      _client.getPaginated<PatientModel>(
        ApiPaths.patients, query, PatientModel.fromJson,);

  @override
  Future<PatientModel> getPatient(String id) async =>
      PatientModel.fromJson(await _client.getObject(ApiPaths.patient(id)));

  @override
  Future<PatientModel> createPatient(Map<String, dynamic> payload) async =>
      PatientModel.fromJson(await _client.post(ApiPaths.patients, body: payload));

  @override
  Future<PatientModel> updatePatient(String id, Map<String, dynamic> payload) async =>
      PatientModel.fromJson(
        await _client.patch(ApiPaths.patient(id), body: payload),);

  @override
  Future<void> deletePatient(String id) =>
      _client.delete(ApiPaths.patient(id));

  @override
  Future<Paginated<AppointmentModel>> listAppointments(ListQuery query) =>
      _client.getPaginated<AppointmentModel>(
        ApiPaths.appointments, query, AppointmentModel.fromJson,);

  @override
  Future<AppointmentModel> getAppointment(String id) async =>
      AppointmentModel.fromJson(
        await _client.getObject(ApiPaths.appointment(id)),);

  @override
  Future<AppointmentModel> createAppointment(Map<String, dynamic> payload) async =>
      AppointmentModel.fromJson(
        await _client.post(ApiPaths.appointments, body: payload),);

  @override
  Future<AppointmentModel> updateAppointment(
    String id, Map<String, dynamic> payload,) async =>
      AppointmentModel.fromJson(
        await _client.patch(ApiPaths.appointment(id), body: payload),);

  @override
  Future<void> deleteAppointment(String id) =>
      _client.delete(ApiPaths.appointment(id));

  @override
  Future<Paginated<PrescriptionModel>> listPrescriptions(ListQuery query) =>
      _client.getPaginated<PrescriptionModel>(
        ApiPaths.prescriptions, query, PrescriptionModel.fromJson,);

  @override
  Future<PrescriptionModel> getPrescription(String id) async =>
      PrescriptionModel.fromJson(
        await _client.getObject(ApiPaths.prescription(id)),);

  @override
  Future<PrescriptionModel> createPrescription(Map<String, dynamic> payload) async =>
      PrescriptionModel.fromJson(
        await _client.post(ApiPaths.prescriptions, body: payload),);

  @override
  Future<Paginated<LabOrderModel>> listLabOrders(ListQuery query) =>
      _client.getPaginated<LabOrderModel>(
        ApiPaths.labOrders, query, LabOrderModel.fromJson,);

  @override
  Future<LabOrderModel> getLabOrder(String id) async =>
      LabOrderModel.fromJson(await _client.getObject(ApiPaths.labOrder(id)));

  @override
  Future<LabOrderModel> createLabOrder(Map<String, dynamic> payload) async =>
      LabOrderModel.fromJson(
        await _client.post(ApiPaths.labOrders, body: payload),);

  @override
  Future<LabOrderModel> updateLabOrderResult(
    String id, Map<String, dynamic> payload,) async =>
      LabOrderModel.fromJson(
        await _client.patch(ApiPaths.labOrder(id), body: payload),);

  @override
  Future<Paginated<MedicalRecordModel>> listMedicalRecords(ListQuery query) =>
      _client.getPaginated<MedicalRecordModel>(
        ApiPaths.medicalRecords, query, MedicalRecordModel.fromJson,);

  @override
  Future<MedicalRecordModel> getMedicalRecord(String id) async =>
      MedicalRecordModel.fromJson(
        await _client.getObject(ApiPaths.medicalRecord(id)),);

  @override
  Future<MedicalRecordModel> createMedicalRecord(
    Map<String, dynamic> payload,) async =>
      MedicalRecordModel.fromJson(
        await _client.post(ApiPaths.medicalRecords, body: payload),);

  @override
  Future<Paginated<InsuranceClaimModel>> listInsuranceClaims(ListQuery query) =>
      _client.getPaginated<InsuranceClaimModel>(
        ApiPaths.insuranceClaims, query, InsuranceClaimModel.fromJson,);

  @override
  Future<InsuranceClaimModel> getInsuranceClaim(String id) async =>
      InsuranceClaimModel.fromJson(
        await _client.getObject(ApiPaths.insuranceClaim(id)),);

  @override
  Future<InsuranceClaimModel> createInsuranceClaim(
    Map<String, dynamic> payload,) async =>
      InsuranceClaimModel.fromJson(
        await _client.post(ApiPaths.insuranceClaims, body: payload),);

  @override
  Future<InsuranceClaimModel> updateInsuranceClaim(
    String id, Map<String, dynamic> payload,) async =>
      InsuranceClaimModel.fromJson(
        await _client.patch(ApiPaths.insuranceClaim(id), body: payload),);

  @override
  Future<InsuranceClaimModel> submitInsuranceClaim(String id) async =>
      InsuranceClaimModel.fromJson(
        await _client.post(ApiPaths.insuranceClaim(id), body: <String, dynamic>{'action': 'submit'}),);

  @override
  Future<InsuranceClaimModel> approveInsuranceClaim(String id) async =>
      InsuranceClaimModel.fromJson(
        await _client.post(ApiPaths.insuranceClaim(id), body: <String, dynamic>{'action': 'approve'}),);

  @override
  Future<InsuranceClaimModel> rejectInsuranceClaim(String id) async =>
      InsuranceClaimModel.fromJson(
        await _client.post(ApiPaths.insuranceClaim(id), body: <String, dynamic>{'action': 'reject'}),);
}
