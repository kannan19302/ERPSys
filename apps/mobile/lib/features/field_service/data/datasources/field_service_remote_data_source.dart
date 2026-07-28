import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/field_service_models.dart';

abstract class FieldServiceRemoteDataSource {
  Future<Paginated<ServiceTicketModel>> listServiceTickets(ListQuery query);
  Future<ServiceTicketModel> getServiceTicket(String id);
  Future<ServiceTicketModel> createServiceTicket(Map<String, dynamic> payload);
  Future<ServiceTicketModel> updateServiceTicket(String id, Map<String, dynamic> payload);
  Future<void> deleteServiceTicket(String id);
  Future<ServiceTicketModel> dispatchServiceTicket(String id, Map<String, dynamic> payload);
  Future<ServiceTicketModel> completeServiceTicket(String id, Map<String, dynamic> payload);
  Future<ServiceTicketModel> cancelServiceTicket(String id);

  Future<Paginated<TechnicianModel>> listTechnicians(ListQuery query);
  Future<TechnicianModel> getTechnician(String id);
  Future<TechnicianModel> createTechnician(Map<String, dynamic> payload);
  Future<TechnicianModel> updateTechnician(String id, Map<String, dynamic> payload);
  Future<void> deleteTechnician(String id);

  Future<Paginated<ServiceScheduleModel>> listServiceSchedules(ListQuery query);
  Future<ServiceScheduleModel> getServiceSchedule(String id);
  Future<ServiceScheduleModel> createServiceSchedule(Map<String, dynamic> payload);
  Future<ServiceScheduleModel> updateServiceSchedule(String id, Map<String, dynamic> payload);
  Future<void> deleteServiceSchedule(String id);
  Future<ServiceScheduleModel> startServiceSchedule(String id);
  Future<ServiceScheduleModel> completeServiceSchedule(String id);

  Future<Paginated<ServiceContractModel>> listServiceContracts(ListQuery query);
  Future<ServiceContractModel> getServiceContract(String id);
  Future<ServiceContractModel> createServiceContract(Map<String, dynamic> payload);
  Future<ServiceContractModel> updateServiceContract(String id, Map<String, dynamic> payload);
  Future<void> deleteServiceContract(String id);
  Future<ServiceContractModel> renewServiceContract(String id);
}

class FieldServiceRemoteDataSourceImpl implements FieldServiceRemoteDataSource {
  const FieldServiceRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<ServiceTicketModel>> listServiceTickets(ListQuery query) =>
      _client.getPaginated<ServiceTicketModel>(
        ApiPaths.serviceTickets, query, ServiceTicketModel.fromJson);

  @override
  Future<ServiceTicketModel> getServiceTicket(String id) async =>
      ServiceTicketModel.fromJson(
        await _client.getObject(ApiPaths.serviceTicket(id)));

  @override
  Future<ServiceTicketModel> createServiceTicket(
    Map<String, dynamic> payload) async =>
      ServiceTicketModel.fromJson(
        await _client.post(ApiPaths.serviceTickets, body: payload));

  @override
  Future<ServiceTicketModel> updateServiceTicket(
    String id, Map<String, dynamic> payload) async =>
      ServiceTicketModel.fromJson(
        await _client.patch(ApiPaths.serviceTicket(id), body: payload));

  @override
  Future<void> deleteServiceTicket(String id) =>
      _client.delete(ApiPaths.serviceTicket(id));

  @override
  Future<ServiceTicketModel> dispatchServiceTicket(
    String id, Map<String, dynamic> payload) async =>
      ServiceTicketModel.fromJson(
        await _client.post(
          '${ApiPaths.serviceTicket(id)}/dispatch', body: payload));

  @override
  Future<ServiceTicketModel> completeServiceTicket(
    String id, Map<String, dynamic> payload) async =>
      ServiceTicketModel.fromJson(
        await _client.post(
          '${ApiPaths.serviceTicket(id)}/complete', body: payload));

  @override
  Future<ServiceTicketModel> cancelServiceTicket(String id) async =>
      ServiceTicketModel.fromJson(
        await _client.post(
          '${ApiPaths.serviceTicket(id)}/cancel'));

  @override
  Future<Paginated<TechnicianModel>> listTechnicians(ListQuery query) =>
      _client.getPaginated<TechnicianModel>(
        ApiPaths.technicians, query, TechnicianModel.fromJson);

  @override
  Future<TechnicianModel> getTechnician(String id) async =>
      TechnicianModel.fromJson(
        await _client.getObject(ApiPaths.technician(id)));

  @override
  Future<TechnicianModel> createTechnician(Map<String, dynamic> payload) async =>
      TechnicianModel.fromJson(
        await _client.post(ApiPaths.technicians, body: payload));

  @override
  Future<TechnicianModel> updateTechnician(
    String id, Map<String, dynamic> payload) async =>
      TechnicianModel.fromJson(
        await _client.patch(ApiPaths.technician(id), body: payload));

  @override
  Future<void> deleteTechnician(String id) =>
      _client.delete(ApiPaths.technician(id));

  @override
  Future<Paginated<ServiceScheduleModel>> listServiceSchedules(
    ListQuery query) =>
      _client.getPaginated<ServiceScheduleModel>(
        ApiPaths.serviceSchedules, query, ServiceScheduleModel.fromJson);

  @override
  Future<ServiceScheduleModel> getServiceSchedule(String id) async =>
      ServiceScheduleModel.fromJson(
        await _client.getObject(ApiPaths.serviceSchedule(id)));

  @override
  Future<ServiceScheduleModel> createServiceSchedule(
    Map<String, dynamic> payload) async =>
      ServiceScheduleModel.fromJson(
        await _client.post(ApiPaths.serviceSchedules, body: payload));

  @override
  Future<ServiceScheduleModel> updateServiceSchedule(
    String id, Map<String, dynamic> payload) async =>
      ServiceScheduleModel.fromJson(
        await _client.patch(ApiPaths.serviceSchedule(id), body: payload));

  @override
  Future<void> deleteServiceSchedule(String id) =>
      _client.delete(ApiPaths.serviceSchedule(id));

  @override
  Future<ServiceScheduleModel> startServiceSchedule(String id) async =>
      ServiceScheduleModel.fromJson(
        await _client.post(
          '${ApiPaths.serviceSchedule(id)}/start'));

  @override
  Future<ServiceScheduleModel> completeServiceSchedule(String id) async =>
      ServiceScheduleModel.fromJson(
        await _client.post(
          '${ApiPaths.serviceSchedule(id)}/complete'));

  @override
  Future<Paginated<ServiceContractModel>> listServiceContracts(
    ListQuery query) =>
      _client.getPaginated<ServiceContractModel>(
        ApiPaths.serviceContracts, query, ServiceContractModel.fromJson);

  @override
  Future<ServiceContractModel> getServiceContract(String id) async =>
      ServiceContractModel.fromJson(
        await _client.getObject(ApiPaths.serviceContract(id)));

  @override
  Future<ServiceContractModel> createServiceContract(
    Map<String, dynamic> payload) async =>
      ServiceContractModel.fromJson(
        await _client.post(ApiPaths.serviceContracts, body: payload));

  @override
  Future<ServiceContractModel> updateServiceContract(
    String id, Map<String, dynamic> payload) async =>
      ServiceContractModel.fromJson(
        await _client.patch(ApiPaths.serviceContract(id), body: payload));

  @override
  Future<void> deleteServiceContract(String id) =>
      _client.delete(ApiPaths.serviceContract(id));

  @override
  Future<ServiceContractModel> renewServiceContract(String id) async =>
      ServiceContractModel.fromJson(
        await _client.post(
          '${ApiPaths.serviceContract(id)}/renew'));
}
