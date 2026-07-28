import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/service_management_models.dart';

abstract class ServiceManagementRemoteDataSource {
  Future<Paginated<ServiceCatalogModel>> listCatalogs(ListQuery query);
  Future<ServiceCatalogModel> getCatalog(String id);
  Future<ServiceCatalogModel> createCatalog(Map<String, dynamic> payload);
  Future<ServiceCatalogModel> updateCatalog(String id, Map<String, dynamic> payload);
  Future<void> deleteCatalog(String id);

  Future<Paginated<ServiceRequestModel>> listRequests(ListQuery query);
  Future<ServiceRequestModel> getRequest(String id);
  Future<ServiceRequestModel> createRequest(Map<String, dynamic> payload);
  Future<ServiceRequestModel> updateRequest(String id, Map<String, dynamic> payload);
  Future<ServiceRequestModel> assignRequest(String id, String userId);
  Future<ServiceRequestModel> resolveRequest(String id, String resolution);
  Future<ServiceRequestModel> closeRequest(String id);

  Future<Paginated<ServiceContractModel>> listContracts(ListQuery query);
  Future<ServiceContractModel> getContract(String id);
  Future<ServiceContractModel> createContract(Map<String, dynamic> payload);
  Future<ServiceContractModel> updateContract(String id, Map<String, dynamic> payload);
  Future<ServiceContractModel> renewContract(String id);
  Future<void> terminateContract(String id);

  Future<Paginated<ServiceLevelAgreementModel>> listSlas(ListQuery query);
  Future<ServiceLevelAgreementModel> getSla(String id);
  Future<ServiceLevelAgreementModel> createSla(Map<String, dynamic> payload);
  Future<ServiceLevelAgreementModel> updateSla(String id, Map<String, dynamic> payload);
  Future<void> deleteSla(String id);
}

class ServiceManagementRemoteDataSourceImpl implements ServiceManagementRemoteDataSource {
  const ServiceManagementRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<ServiceCatalogModel>> listCatalogs(ListQuery query) =>
      _client.getPaginated<ServiceCatalogModel>(
        ApiPaths.serviceCatalogs, query, ServiceCatalogModel.fromJson);

  @override
  Future<ServiceCatalogModel> getCatalog(String id) async =>
      ServiceCatalogModel.fromJson(
        await _client.getObject(ApiPaths.serviceCatalog(id)));

  @override
  Future<ServiceCatalogModel> createCatalog(Map<String, dynamic> payload) async =>
      ServiceCatalogModel.fromJson(
        await _client.post(ApiPaths.serviceCatalogs, body: payload));

  @override
  Future<ServiceCatalogModel> updateCatalog(String id, Map<String, dynamic> payload) async =>
      ServiceCatalogModel.fromJson(
        await _client.patch(ApiPaths.serviceCatalog(id), body: payload));

  @override
  Future<void> deleteCatalog(String id) =>
      _client.delete(ApiPaths.serviceCatalog(id));

  @override
  Future<Paginated<ServiceRequestModel>> listRequests(ListQuery query) =>
      _client.getPaginated<ServiceRequestModel>(
        ApiPaths.serviceRequests, query, ServiceRequestModel.fromJson);

  @override
  Future<ServiceRequestModel> getRequest(String id) async =>
      ServiceRequestModel.fromJson(
        await _client.getObject(ApiPaths.serviceRequest(id)));

  @override
  Future<ServiceRequestModel> createRequest(Map<String, dynamic> payload) async =>
      ServiceRequestModel.fromJson(
        await _client.post(ApiPaths.serviceRequests, body: payload));

  @override
  Future<ServiceRequestModel> updateRequest(String id, Map<String, dynamic> payload) async =>
      ServiceRequestModel.fromJson(
        await _client.patch(ApiPaths.serviceRequest(id), body: payload));

  @override
  Future<ServiceRequestModel> assignRequest(String id, String userId) async =>
      ServiceRequestModel.fromJson(
        await _client.post('${ApiPaths.serviceRequest(id)}/assign', body: <String, dynamic>{'userId': userId}));

  @override
  Future<ServiceRequestModel> resolveRequest(String id, String resolution) async =>
      ServiceRequestModel.fromJson(
        await _client.post('${ApiPaths.serviceRequest(id)}/resolve', body: <String, dynamic>{'resolution': resolution}));

  @override
  Future<ServiceRequestModel> closeRequest(String id) async =>
      ServiceRequestModel.fromJson(
        await _client.post('${ApiPaths.serviceRequest(id)}/close'));

  @override
  Future<Paginated<ServiceContractModel>> listContracts(ListQuery query) =>
      _client.getPaginated<ServiceContractModel>(
        ApiPaths.serviceContractsMgmt, query, ServiceContractModel.fromJson);

  @override
  Future<ServiceContractModel> getContract(String id) async =>
      ServiceContractModel.fromJson(
        await _client.getObject(ApiPaths.serviceContractMgmt(id)));

  @override
  Future<ServiceContractModel> createContract(Map<String, dynamic> payload) async =>
      ServiceContractModel.fromJson(
        await _client.post(ApiPaths.serviceContractsMgmt, body: payload));

  @override
  Future<ServiceContractModel> updateContract(String id, Map<String, dynamic> payload) async =>
      ServiceContractModel.fromJson(
        await _client.patch(ApiPaths.serviceContractMgmt(id), body: payload));

  @override
  Future<ServiceContractModel> renewContract(String id) async =>
      ServiceContractModel.fromJson(
        await _client.post('${ApiPaths.serviceContractMgmt(id)}/renew'));

  @override
  Future<void> terminateContract(String id) =>
      _client.delete(ApiPaths.serviceContractMgmt(id));

  @override
  Future<Paginated<ServiceLevelAgreementModel>> listSlas(ListQuery query) =>
      _client.getPaginated<ServiceLevelAgreementModel>(
        ApiPaths.serviceLevelAgreements, query, ServiceLevelAgreementModel.fromJson);

  @override
  Future<ServiceLevelAgreementModel> getSla(String id) async =>
      ServiceLevelAgreementModel.fromJson(
        await _client.getObject(ApiPaths.serviceLevelAgreement(id)));

  @override
  Future<ServiceLevelAgreementModel> createSla(Map<String, dynamic> payload) async =>
      ServiceLevelAgreementModel.fromJson(
        await _client.post(ApiPaths.serviceLevelAgreements, body: payload));

  @override
  Future<ServiceLevelAgreementModel> updateSla(String id, Map<String, dynamic> payload) async =>
      ServiceLevelAgreementModel.fromJson(
        await _client.patch(ApiPaths.serviceLevelAgreement(id), body: payload));

  @override
  Future<void> deleteSla(String id) =>
      _client.delete(ApiPaths.serviceLevelAgreement(id));
}