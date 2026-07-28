import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/saas_portal_models.dart';

abstract class SaasPortalRemoteDataSource {
  Future<PortalBillingInfoModel> getBillingInfo();
  Future<PortalBillingInfoModel> updateBillingInfo(Map<String, dynamic> payload);

  Future<Paginated<PortalPlanModel>> listPlans(ListQuery query);

  Future<Paginated<PortalSupportTicketModel>> listSupportTickets(ListQuery query);
  Future<PortalSupportTicketModel> getSupportTicket(String id);
  Future<PortalSupportTicketModel> createSupportTicket(Map<String, dynamic> payload);
}

class SaasPortalRemoteDataSourceImpl implements SaasPortalRemoteDataSource {
  const SaasPortalRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<PortalBillingInfoModel> getBillingInfo() async =>
      PortalBillingInfoModel.fromJson(
        await _client.getObject(ApiPaths.portalBilling));

  @override
  Future<PortalBillingInfoModel> updateBillingInfo(Map<String, dynamic> payload) async =>
      PortalBillingInfoModel.fromJson(
        await _client.patch(ApiPaths.portalBilling, body: payload));

  @override
  Future<Paginated<PortalPlanModel>> listPlans(ListQuery query) =>
      _client.getPaginated<PortalPlanModel>(
        ApiPaths.portalPlans, query, PortalPlanModel.fromJson);

  @override
  Future<Paginated<PortalSupportTicketModel>> listSupportTickets(ListQuery query) =>
      _client.getPaginated<PortalSupportTicketModel>(
        ApiPaths.portalSupport, query, PortalSupportTicketModel.fromJson);

  @override
  Future<PortalSupportTicketModel> getSupportTicket(String id) async =>
      PortalSupportTicketModel.fromJson(
        await _client.getObject(ApiPaths.portalTicket(id)));

  @override
  Future<PortalSupportTicketModel> createSupportTicket(Map<String, dynamic> payload) async =>
      PortalSupportTicketModel.fromJson(
        await _client.post(ApiPaths.portalSupport, body: payload));
}
