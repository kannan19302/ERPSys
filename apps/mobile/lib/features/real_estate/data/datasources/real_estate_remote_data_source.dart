import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/real_estate_models.dart';

abstract class RealEstateRemoteDataSource {
  Future<Paginated<PropertyModel>> listProperties(ListQuery query);
  Future<PropertyModel> getProperty(String id);
  Future<PropertyModel> createProperty(Map<String, dynamic> payload);
  Future<PropertyModel> updateProperty(String id, Map<String, dynamic> payload);
  Future<void> deleteProperty(String id);

  Future<Paginated<LeaseModel>> listLeases(ListQuery query);
  Future<LeaseModel> getLease(String id);
  Future<LeaseModel> createLease(Map<String, dynamic> payload);
  Future<LeaseModel> updateLease(String id, Map<String, dynamic> payload);
  Future<void> deleteLease(String id);

  Future<Paginated<TenantDetailModel>> listTenants(ListQuery query);
  Future<TenantDetailModel> getTenant(String id);
  Future<TenantDetailModel> createTenant(Map<String, dynamic> payload);
  Future<TenantDetailModel> updateTenant(String id, Map<String, dynamic> payload);
  Future<void> deleteTenant(String id);

  Future<Paginated<MaintenanceOrderModel>> listMaintenanceOrders(ListQuery query);
  Future<MaintenanceOrderModel> getMaintenanceOrder(String id);
  Future<MaintenanceOrderModel> createMaintenanceOrder(Map<String, dynamic> payload);
  Future<MaintenanceOrderModel> updateMaintenanceOrder(String id, Map<String, dynamic> payload);
  Future<void> deleteMaintenanceOrder(String id);
  Future<MaintenanceOrderModel> completeMaintenanceOrder(String id);

  Future<Paginated<PropertyValuationModel>> listPropertyValuations(ListQuery query);
  Future<PropertyValuationModel> createPropertyValuation(Map<String, dynamic> payload);
}

class RealEstateRemoteDataSourceImpl implements RealEstateRemoteDataSource {
  const RealEstateRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<PropertyModel>> listProperties(ListQuery query) =>
      _client.getPaginated<PropertyModel>(
        ApiPaths.properties, query, PropertyModel.fromJson,);

  @override
  Future<PropertyModel> getProperty(String id) async =>
      PropertyModel.fromJson(await _client.getObject(ApiPaths.property(id)));

  @override
  Future<PropertyModel> createProperty(Map<String, dynamic> payload) async =>
      PropertyModel.fromJson(await _client.post(ApiPaths.properties, body: payload));

  @override
  Future<PropertyModel> updateProperty(String id, Map<String, dynamic> payload) async =>
      PropertyModel.fromJson(await _client.patch(ApiPaths.property(id), body: payload));

  @override
  Future<void> deleteProperty(String id) =>
      _client.delete(ApiPaths.property(id));

  @override
  Future<Paginated<LeaseModel>> listLeases(ListQuery query) =>
      _client.getPaginated<LeaseModel>(ApiPaths.leases, query, LeaseModel.fromJson);

  @override
  Future<LeaseModel> getLease(String id) async =>
      LeaseModel.fromJson(await _client.getObject(ApiPaths.lease(id)));

  @override
  Future<LeaseModel> createLease(Map<String, dynamic> payload) async =>
      LeaseModel.fromJson(await _client.post(ApiPaths.leases, body: payload));

  @override
  Future<LeaseModel> updateLease(String id, Map<String, dynamic> payload) async =>
      LeaseModel.fromJson(await _client.patch(ApiPaths.lease(id), body: payload));

  @override
  Future<void> deleteLease(String id) =>
      _client.delete(ApiPaths.lease(id));

  @override
  Future<Paginated<TenantDetailModel>> listTenants(ListQuery query) =>
      _client.getPaginated<TenantDetailModel>(ApiPaths.realEstateTenants, query, TenantDetailModel.fromJson);

  @override
  Future<TenantDetailModel> getTenant(String id) async =>
      TenantDetailModel.fromJson(await _client.getObject(ApiPaths.realEstateTenantDetail(id)));

  @override
  Future<TenantDetailModel> createTenant(Map<String, dynamic> payload) async =>
      TenantDetailModel.fromJson(await _client.post(ApiPaths.realEstateTenants, body: payload));

  @override
  Future<TenantDetailModel> updateTenant(String id, Map<String, dynamic> payload) async =>
      TenantDetailModel.fromJson(await _client.patch(ApiPaths.realEstateTenantDetail(id), body: payload));

  @override
  Future<void> deleteTenant(String id) =>
      _client.delete(ApiPaths.realEstateTenantDetail(id));

  @override
  Future<Paginated<MaintenanceOrderModel>> listMaintenanceOrders(ListQuery query) =>
      _client.getPaginated<MaintenanceOrderModel>(
        ApiPaths.maintenanceOrders, query, MaintenanceOrderModel.fromJson,);

  @override
  Future<MaintenanceOrderModel> getMaintenanceOrder(String id) async =>
      MaintenanceOrderModel.fromJson(await _client.getObject(ApiPaths.maintenanceOrder(id)));

  @override
  Future<MaintenanceOrderModel> createMaintenanceOrder(Map<String, dynamic> payload) async =>
      MaintenanceOrderModel.fromJson(
        await _client.post(ApiPaths.maintenanceOrders, body: payload),);

  @override
  Future<MaintenanceOrderModel> updateMaintenanceOrder(
    String id, Map<String, dynamic> payload,) async =>
      MaintenanceOrderModel.fromJson(
        await _client.patch(ApiPaths.maintenanceOrder(id), body: payload),);

  @override
  Future<void> deleteMaintenanceOrder(String id) =>
      _client.delete(ApiPaths.maintenanceOrder(id));

  @override
  Future<MaintenanceOrderModel> completeMaintenanceOrder(String id) async =>
      MaintenanceOrderModel.fromJson(
        await _client.post('${ApiPaths.maintenanceOrder(id)}/complete'),);

  @override
  Future<Paginated<PropertyValuationModel>> listPropertyValuations(ListQuery query) =>
      _client.getPaginated<PropertyValuationModel>(
        ApiPaths.propertyValuations, query, PropertyValuationModel.fromJson,);

  @override
  Future<PropertyValuationModel> createPropertyValuation(Map<String, dynamic> payload) async =>
      PropertyValuationModel.fromJson(
        await _client.post(ApiPaths.propertyValuations, body: payload),);
}
