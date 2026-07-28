import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/saas.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class SaasRepository {
  Future<Result<Cacheable<Paginated<SaasPlan>>>> listPlans(ListQuery query);
  Future<Result<SaasPlan>> getPlan(String id);
  Future<Result<SaasPlan>> createPlan(Map<String, dynamic> payload);
  Future<Result<SaasPlan>> updatePlan(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePlan(String id);

  Future<Result<Cacheable<Paginated<SaasSubscription>>>> listSubscriptions(ListQuery query);
  Future<Result<SaasSubscription>> getSubscription(String id);
  Future<Result<SaasSubscription>> createSubscription(Map<String, dynamic> payload);
  Future<Result<SaasSubscription>> updateSubscription(String id, Map<String, dynamic> payload);
  Future<Result<void>> cancelSubscription(String id);

  Future<Result<Cacheable<Paginated<SaasInvoice>>>> listInvoices(ListQuery query);
  Future<Result<SaasInvoice>> getInvoice(String id);

  Future<Result<Cacheable<Paginated<SaasUsageRecord>>>> listUsage(ListQuery query);

  Future<Result<Cacheable<Paginated<SaasQuota>>>> listQuotas(ListQuery query);

  Future<Result<Cacheable<Paginated<SaasTenant>>>> listTenants(ListQuery query);
  Future<Result<SaasTenant>> getTenant(String id);
  Future<Result<SaasTenant>> updateTenant(String id, Map<String, dynamic> payload);
}
