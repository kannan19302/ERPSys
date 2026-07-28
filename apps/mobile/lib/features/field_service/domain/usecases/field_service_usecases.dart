import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/field_service.dart';
import '../repositories/field_service_repository.dart';

class ListServiceTicketsUseCase extends UseCase<Cacheable<Paginated<ServiceTicket>>, ListQuery> {
  const ListServiceTicketsUseCase(this._repository);
  final FieldServiceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ServiceTicket>>>> call(ListQuery params) =>
      _repository.listServiceTickets(params);
}

class GetServiceTicketUseCase extends UseCase<ServiceTicket, String> {
  const GetServiceTicketUseCase(this._repository);
  final FieldServiceRepository _repository;
  @override
  Future<Result<ServiceTicket>> call(String id) => _repository.getServiceTicket(id);
}

class SaveServiceTicketParams {
  const SaveServiceTicketParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveServiceTicketUseCase extends UseCase<ServiceTicket, SaveServiceTicketParams> {
  const SaveServiceTicketUseCase(this._repository);
  final FieldServiceRepository _repository;
  @override
  Future<Result<ServiceTicket>> call(SaveServiceTicketParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createServiceTicket(params.payload)
        : _repository.updateServiceTicket(id, params.payload);
  }
}

class DeleteServiceTicketUseCase extends UseCase<void, String> {
  const DeleteServiceTicketUseCase(this._repository);
  final FieldServiceRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteServiceTicket(id);
}

class ListTechniciansUseCase extends UseCase<Cacheable<Paginated<Technician>>, ListQuery> {
  const ListTechniciansUseCase(this._repository);
  final FieldServiceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Technician>>>> call(ListQuery params) =>
      _repository.listTechnicians(params);
}

class GetTechnicianUseCase extends UseCase<Technician, String> {
  const GetTechnicianUseCase(this._repository);
  final FieldServiceRepository _repository;
  @override
  Future<Result<Technician>> call(String id) => _repository.getTechnician(id);
}

class SaveTechnicianParams {
  const SaveTechnicianParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveTechnicianUseCase extends UseCase<Technician, SaveTechnicianParams> {
  const SaveTechnicianUseCase(this._repository);
  final FieldServiceRepository _repository;
  @override
  Future<Result<Technician>> call(SaveTechnicianParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createTechnician(params.payload)
        : _repository.updateTechnician(id, params.payload);
  }
}

class DeleteTechnicianUseCase extends UseCase<void, String> {
  const DeleteTechnicianUseCase(this._repository);
  final FieldServiceRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteTechnician(id);
}

class ListServiceSchedulesUseCase extends UseCase<Cacheable<Paginated<ServiceSchedule>>, ListQuery> {
  const ListServiceSchedulesUseCase(this._repository);
  final FieldServiceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ServiceSchedule>>>> call(ListQuery params) =>
      _repository.listServiceSchedules(params);
}

class ListServiceContractsUseCase extends UseCase<Cacheable<Paginated<ServiceContract>>, ListQuery> {
  const ListServiceContractsUseCase(this._repository);
  final FieldServiceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ServiceContract>>>> call(ListQuery params) =>
      _repository.listServiceContracts(params);
}
