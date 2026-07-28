import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/saas_portal.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class SaasPortalRepository {
  Future<Result<PortalBillingInfo>> getBillingInfo();
  Future<Result<PortalBillingInfo>> updateBillingInfo(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<PortalPlan>>>> listPlans(ListQuery query);

  Future<Result<Cacheable<Paginated<PortalSupportTicket>>>> listSupportTickets(ListQuery query);
  Future<Result<PortalSupportTicket>> getSupportTicket(String id);
  Future<Result<PortalSupportTicket>> createSupportTicket(Map<String, dynamic> payload);
}
