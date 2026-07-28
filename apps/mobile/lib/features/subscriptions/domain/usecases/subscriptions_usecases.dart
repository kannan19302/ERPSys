import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/subscriptions.dart';
import '../repositories/subscriptions_repository.dart';

class ListSubscriptionPlansUseCase extends UseCase<Cacheable<Paginated<SubscriptionPlan>>, ListQuery> {
  const ListSubscriptionPlansUseCase(this._repository);
  final SubscriptionsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SubscriptionPlan>>>> call(ListQuery params) =>
      _repository.listPlans(params);
}

class GetSubscriptionPlanUseCase extends UseCase<SubscriptionPlan, String> {
  const GetSubscriptionPlanUseCase(this._repository);
  final SubscriptionsRepository _repository;
  @override
  Future<Result<SubscriptionPlan>> call(String id) => _repository.getPlan(id);
}

class ListSubscriptionBillingCyclesUseCase extends UseCase<Cacheable<Paginated<SubscriptionBillingCycle>>, ListQuery> {
  const ListSubscriptionBillingCyclesUseCase(this._repository);
  final SubscriptionsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SubscriptionBillingCycle>>>> call(ListQuery params) =>
      _repository.listBillingCycles(params);
}

class GetSubscriptionBillingCycleUseCase extends UseCase<SubscriptionBillingCycle, String> {
  const GetSubscriptionBillingCycleUseCase(this._repository);
  final SubscriptionsRepository _repository;
  @override
  Future<Result<SubscriptionBillingCycle>> call(String id) => _repository.getBillingCycle(id);
}

class ListSubscriptionUsageUseCase extends UseCase<Cacheable<Paginated<SubscriptionUsageRecord>>, ListQuery> {
  const ListSubscriptionUsageUseCase(this._repository);
  final SubscriptionsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SubscriptionUsageRecord>>>> call(ListQuery params) =>
      _repository.listUsage(params);
}

class SubmitChurnSurveyUseCase extends UseCase<ChurnSurveyResponse, Map<String, dynamic>> {
  const SubmitChurnSurveyUseCase(this._repository);
  final SubscriptionsRepository _repository;
  @override
  Future<Result<ChurnSurveyResponse>> call(Map<String, dynamic> payload) =>
      _repository.submitChurnSurvey(payload);
}
