import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/subscriptions_models.dart';

abstract class SubscriptionsRemoteDataSource {
  Future<Paginated<SubscriptionPlanModel>> listPlans(ListQuery query);
  Future<SubscriptionPlanModel> getPlan(String id);

  Future<Paginated<SubscriptionBillingCycleModel>> listBillingCycles(ListQuery query);
  Future<SubscriptionBillingCycleModel> getBillingCycle(String id);

  Future<Paginated<SubscriptionUsageRecordModel>> listUsage(ListQuery query);

  Future<ChurnSurveyResponseModel> submitChurnSurvey(Map<String, dynamic> payload);
}

class SubscriptionsRemoteDataSourceImpl implements SubscriptionsRemoteDataSource {
  const SubscriptionsRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<SubscriptionPlanModel>> listPlans(ListQuery query) =>
      _client.getPaginated<SubscriptionPlanModel>(
        ApiPaths.subscriptionPlans, query, SubscriptionPlanModel.fromJson,);

  @override
  Future<SubscriptionPlanModel> getPlan(String id) async =>
      SubscriptionPlanModel.fromJson(
        await _client.getObject(ApiPaths.subscriptionPlan(id)),);

  @override
  Future<Paginated<SubscriptionBillingCycleModel>> listBillingCycles(ListQuery query) =>
      _client.getPaginated<SubscriptionBillingCycleModel>(
        ApiPaths.subscriptionBilling, query, SubscriptionBillingCycleModel.fromJson,);

  @override
  Future<SubscriptionBillingCycleModel> getBillingCycle(String id) async =>
      SubscriptionBillingCycleModel.fromJson(
        await _client.getObject(ApiPaths.subscriptionBillingCycle(id)),);

  @override
  Future<Paginated<SubscriptionUsageRecordModel>> listUsage(ListQuery query) =>
      _client.getPaginated<SubscriptionUsageRecordModel>(
        ApiPaths.subscriptionUsage, query, SubscriptionUsageRecordModel.fromJson,);

  @override
  Future<ChurnSurveyResponseModel> submitChurnSurvey(Map<String, dynamic> payload) async =>
      ChurnSurveyResponseModel.fromJson(
        await _client.post(ApiPaths.subscriptionChurn, body: payload),);
}
