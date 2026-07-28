import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/real_estate.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class RealEstateRepository {
  Future<Result<Cacheable<Paginated<Property>>>> listProperties(ListQuery query);
  Future<Result<Property>> getProperty(String id);
  Future<Result<Property>> createProperty(Map<String, dynamic> payload);
  Future<Result<Property>> updateProperty(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteProperty(String id);

  Future<Result<Cacheable<Paginated<Lease>>>> listLeases(ListQuery query);
  Future<Result<Lease>> getLease(String id);
  Future<Result<Lease>> createLease(Map<String, dynamic> payload);
  Future<Result<Lease>> updateLease(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteLease(String id);

  Future<Result<Cacheable<Paginated<TenantDetail>>>> listTenants(ListQuery query);
  Future<Result<TenantDetail>> getTenant(String id);
  Future<Result<TenantDetail>> createTenant(Map<String, dynamic> payload);
  Future<Result<TenantDetail>> updateTenant(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteTenant(String id);

  Future<Result<Cacheable<Paginated<MaintenanceOrder>>>> listMaintenanceOrders(ListQuery query);
  Future<Result<MaintenanceOrder>> getMaintenanceOrder(String id);
  Future<Result<MaintenanceOrder>> createMaintenanceOrder(Map<String, dynamic> payload);
  Future<Result<MaintenanceOrder>> updateMaintenanceOrder(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteMaintenanceOrder(String id);
  Future<Result<MaintenanceOrder>> completeMaintenanceOrder(String id);

  Future<Result<Cacheable<Paginated<PropertyValuation>>>> listPropertyValuations(ListQuery query);
  Future<Result<PropertyValuation>> createPropertyValuation(Map<String, dynamic> payload);
}
