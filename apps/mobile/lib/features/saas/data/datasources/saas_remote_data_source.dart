import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/saas_models.dart';

abstract class SaasRemoteDataSource {
  Future<Paginated<SaasPlanModel>> listPlans(ListQuery query);
  Future<SaasPlanModel> getPlan(String id);
  Future<SaasPlanModel> createPlan(Map<String, dynamic> payload);
  Future<SaasPlanModel> updatePlan(String id, Map<String, dynamic> payload);
  Future<void> deletePlan(String id);

  Future<Paginated<SaasSubscriptionModel>> listSubscriptions(ListQuery query);
  Future<SaasSubscriptionModel> getSubscription(String id);
  Future<SaasSubscriptionModel> createSubscription(Map<String, dynamic> payload);
  Future<SaasSubscriptionModel> updateSubscription(String id, Map<String, dynamic> payload);
  Future<void> cancelSubscription(String id);

  Future<Paginated<SaasInvoiceModel>> listInvoices(ListQuery query);
  Future<SaasInvoiceModel> getInvoice(String id);

  Future<Paginated<SaasUsageRecordModel>> listUsage(ListQuery query);

  Future<Paginated<SaasQuotaModel>> listQuotas(ListQuery query);

  Future<Paginated<SaasTenantModel>> listTenants(ListQuery query);
  Future<SaasTenantModel> getTenant(String id);
  Future<SaasTenantModel> updateTenant(String id, Map<String, dynamic> payload);
}

class SaasRemoteDataSourceImpl implements SaasRemoteDataSource {
  const SaasRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<SaasPlanModel>> listPlans(ListQuery query) =>
      _client.getPaginated<SaasPlanModel>(
        ApiPaths.saasPlans, query, SaasPlanModel.fromJson,);

  @override
  Future<SaasPlanModel> getPlan(String id) async =>
      SaasPlanModel.fromJson(await _client.getObject(ApiPaths.saasPlan(id)));

  @override
  Future<SaasPlanModel> createPlan(Map<String, dynamic> payload) async =>
      SaasPlanModel.fromJson(
        await _client.post(ApiPaths.saasPlans, body: payload),);

  @override
  Future<SaasPlanModel> updatePlan(String id, Map<String, dynamic> payload) async =>
      SaasPlanModel.fromJson(
        await _client.patch(ApiPaths.saasPlan(id), body: payload),);

  @override
  Future<void> deletePlan(String id) =>
      _client.delete(ApiPaths.saasPlan(id));

  @override
  Future<Paginated<SaasSubscriptionModel>> listSubscriptions(ListQuery query) =>
      _client.getPaginated<SaasSubscriptionModel>(
        ApiPaths.saasSubscriptions, query, SaasSubscriptionModel.fromJson,);

  @override
  Future<SaasSubscriptionModel> getSubscription(String id) async =>
      SaasSubscriptionModel.fromJson(
        await _client.getObject(ApiPaths.saasSubscription(id)),);

  @override
  Future<SaasSubscriptionModel> createSubscription(Map<String, dynamic> payload) async =>
      SaasSubscriptionModel.fromJson(
        await _client.post(ApiPaths.saasSubscriptions, body: payload),);

  @override
  Future<SaasSubscriptionModel> updateSubscription(String id, Map<String, dynamic> payload) async =>
      SaasSubscriptionModel.fromJson(
        await _client.patch(ApiPaths.saasSubscription(id), body: payload),);

  @override
  Future<void> cancelSubscription(String id) async {
    await _client.post('${ApiPaths.saasSubscription(id)}/cancel');
  }

  @override
  Future<Paginated<SaasInvoiceModel>> listInvoices(ListQuery query) =>
      _client.getPaginated<SaasInvoiceModel>(
        ApiPaths.saasInvoices, query, SaasInvoiceModel.fromJson,);

  @override
  Future<SaasInvoiceModel> getInvoice(String id) async =>
      SaasInvoiceModel.fromJson(
        await _client.getObject('${ApiPaths.saasInvoices}/$id'),);

  @override
  Future<Paginated<SaasUsageRecordModel>> listUsage(ListQuery query) =>
      _client.getPaginated<SaasUsageRecordModel>(
        ApiPaths.saasUsage, query, SaasUsageRecordModel.fromJson,);

  @override
  Future<Paginated<SaasQuotaModel>> listQuotas(ListQuery query) =>
      _client.getPaginated<SaasQuotaModel>(
        ApiPaths.saasQuotas, query, SaasQuotaModel.fromJson,);

  @override
  Future<Paginated<SaasTenantModel>> listTenants(ListQuery query) =>
      _client.getPaginated<SaasTenantModel>(
        ApiPaths.saasTenants, query, SaasTenantModel.fromJson,);

  @override
  Future<SaasTenantModel> getTenant(String id) async =>
      SaasTenantModel.fromJson(
        await _client.getObject(ApiPaths.saasTenant(id)),);

  @override
  Future<SaasTenantModel> updateTenant(String id, Map<String, dynamic> payload) async =>
      SaasTenantModel.fromJson(
        await _client.patch(ApiPaths.saasTenant(id), body: payload),);
}
