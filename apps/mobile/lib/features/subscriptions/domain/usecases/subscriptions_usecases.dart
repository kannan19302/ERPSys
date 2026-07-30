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

class SaveSubscriptionPlanParams {
  const SaveSubscriptionPlanParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveSubscriptionPlanUseCase extends UseCase<SubscriptionPlan, SaveSubscriptionPlanParams> {
  const SaveSubscriptionPlanUseCase(this._repository);
  final SubscriptionsRepository _repository;
  @override
  Future<Result<SubscriptionPlan>> call(SaveSubscriptionPlanParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPlan(params.payload)
        : _repository.updatePlan(id, params.payload);
  }
}

class SaveSubscriptionBillingCycleUseCase extends UseCase<SubscriptionBillingCycle, SaveBillingCycleParams> {
  const SaveSubscriptionBillingCycleUseCase(this._repository);
  final SubscriptionsRepository _repository;
  @override
  Future<Result<SubscriptionBillingCycle>> call(SaveBillingCycleParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createBillingCycle(params.payload)
        : _repository.updateBillingCycle(id, params.payload);
  }
}

class SaveBillingCycleParams {
  const SaveBillingCycleParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
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

