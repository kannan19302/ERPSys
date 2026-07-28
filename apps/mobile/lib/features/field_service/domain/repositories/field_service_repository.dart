import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/field_service.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class FieldServiceRepository {
  Future<Result<Cacheable<Paginated<ServiceTicket>>>> listServiceTickets(ListQuery query);
  Future<Result<ServiceTicket>> getServiceTicket(String id);
  Future<Result<ServiceTicket>> createServiceTicket(Map<String, dynamic> payload);
  Future<Result<ServiceTicket>> updateServiceTicket(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteServiceTicket(String id);
  Future<Result<ServiceTicket>> dispatchServiceTicket(String id, Map<String, dynamic> payload);
  Future<Result<ServiceTicket>> completeServiceTicket(String id, Map<String, dynamic> payload);
  Future<Result<ServiceTicket>> cancelServiceTicket(String id);

  Future<Result<Cacheable<Paginated<Technician>>>> listTechnicians(ListQuery query);
  Future<Result<Technician>> getTechnician(String id);
  Future<Result<Technician>> createTechnician(Map<String, dynamic> payload);
  Future<Result<Technician>> updateTechnician(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteTechnician(String id);

  Future<Result<Cacheable<Paginated<ServiceSchedule>>>> listServiceSchedules(ListQuery query);
  Future<Result<ServiceSchedule>> getServiceSchedule(String id);
  Future<Result<ServiceSchedule>> createServiceSchedule(Map<String, dynamic> payload);
  Future<Result<ServiceSchedule>> updateServiceSchedule(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteServiceSchedule(String id);
  Future<Result<ServiceSchedule>> startServiceSchedule(String id);
  Future<Result<ServiceSchedule>> completeServiceSchedule(String id);

  Future<Result<Cacheable<Paginated<ServiceContract>>>> listServiceContracts(ListQuery query);
  Future<Result<ServiceContract>> getServiceContract(String id);
  Future<Result<ServiceContract>> createServiceContract(Map<String, dynamic> payload);
  Future<Result<ServiceContract>> updateServiceContract(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteServiceContract(String id);
  Future<Result<ServiceContract>> renewServiceContract(String id);
}
