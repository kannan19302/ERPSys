import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/subscriptions.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class SubscriptionsRepository {
  Future<Result<Cacheable<Paginated<SubscriptionPlan>>>> listPlans(ListQuery query);
  Future<Result<SubscriptionPlan>> getPlan(String id);

  Future<Result<Cacheable<Paginated<SubscriptionBillingCycle>>>> listBillingCycles(ListQuery query);
  Future<Result<SubscriptionBillingCycle>> getBillingCycle(String id);

  Future<Result<Cacheable<Paginated<SubscriptionUsageRecord>>>> listUsage(ListQuery query);

  Future<Result<ChurnSurveyResponse>> submitChurnSurvey(Map<String, dynamic> payload);
}
