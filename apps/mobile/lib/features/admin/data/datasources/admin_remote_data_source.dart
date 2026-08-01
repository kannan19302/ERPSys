import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/admin_models.dart';

abstract class AdminRemoteDataSource {
  Future<Paginated<AdminUserModel>> listUsers(ListQuery query);
  Future<AdminUserModel> getUser(String id);
  Future<AdminUserModel> createUser(Map<String, dynamic> payload);
  Future<AdminUserModel> updateUser(String id, Map<String, dynamic> payload);
  Future<void> deleteUser(String id);

  Future<Paginated<AdminRoleModel>> listRoles(ListQuery query);
  Future<AdminRoleModel> getRole(String id);
  Future<AdminRoleModel> createRole(Map<String, dynamic> payload);
  Future<AdminRoleModel> updateRole(String id, Map<String, dynamic> payload);
  Future<void> deleteRole(String id);

  Future<Paginated<AdminSettingModel>> listSettings(ListQuery query);
  Future<AdminSettingModel> updateSetting(String key, Map<String, dynamic> payload);

  Future<Paginated<AdminAuditLogModel>> listAuditLogs(ListQuery query);
  Future<SystemHealthModel> getSystemHealth();

  Future<Paginated<AdminApiKeyModel>> listApiKeys(ListQuery query);
  Future<AdminApiKeyModel> getApiKey(String id);
  Future<AdminApiKeyModel> createApiKey(Map<String, dynamic> payload);
  Future<void> deleteApiKey(String id);

  Future<Paginated<AdminTenantModel>> listTenants(ListQuery query);
  Future<AdminTenantModel> getTenant(String id);
  Future<AdminTenantModel> createTenant(Map<String, dynamic> payload);
}

class AdminRemoteDataSourceImpl implements AdminRemoteDataSource {
  const AdminRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<AdminUserModel>> listUsers(ListQuery query) =>
      _client.getPaginated<AdminUserModel>(
        ApiPaths.adminUsers, query, AdminUserModel.fromJson,);

  @override
  Future<AdminUserModel> getUser(String id) async =>
      AdminUserModel.fromJson(
        await _client.getObject(ApiPaths.adminUser(id)),);

  @override
  Future<AdminUserModel> createUser(Map<String, dynamic> payload) async =>
      AdminUserModel.fromJson(
        await _client.post(ApiPaths.adminUsers, body: payload),);

  @override
  Future<AdminUserModel> updateUser(String id, Map<String, dynamic> payload) async =>
      AdminUserModel.fromJson(
        await _client.patch(ApiPaths.adminUser(id), body: payload),);

  @override
  Future<void> deleteUser(String id) =>
      _client.delete(ApiPaths.adminUser(id));

  @override
  Future<Paginated<AdminRoleModel>> listRoles(ListQuery query) =>
      _client.getPaginated<AdminRoleModel>(
        ApiPaths.adminRoles, query, AdminRoleModel.fromJson,);

  @override
  Future<AdminRoleModel> getRole(String id) async =>
      AdminRoleModel.fromJson(
        await _client.getObject(ApiPaths.adminRole(id)),);

  @override
  Future<AdminRoleModel> createRole(Map<String, dynamic> payload) async =>
      AdminRoleModel.fromJson(
        await _client.post(ApiPaths.adminRoles, body: payload),);

  @override
  Future<AdminRoleModel> updateRole(String id, Map<String, dynamic> payload) async =>
      AdminRoleModel.fromJson(
        await _client.patch(ApiPaths.adminRole(id), body: payload),);

  @override
  Future<void> deleteRole(String id) =>
      _client.delete(ApiPaths.adminRole(id));

  @override
  Future<Paginated<AdminSettingModel>> listSettings(ListQuery query) =>
      _client.getPaginated<AdminSettingModel>(
        ApiPaths.adminSettings, query, AdminSettingModel.fromJson,);

  @override
  Future<AdminSettingModel> updateSetting(String key, Map<String, dynamic> payload) async =>
      AdminSettingModel.fromJson(
        await _client.patch('${ApiPaths.adminSettings}/$key', body: payload),);

  @override
  Future<Paginated<AdminAuditLogModel>> listAuditLogs(ListQuery query) =>
      _client.getPaginated<AdminAuditLogModel>(
        ApiPaths.adminAuditLog, query, AdminAuditLogModel.fromJson,);

  @override
  Future<SystemHealthModel> getSystemHealth() async =>
      SystemHealthModel.fromJson(
        await _client.getObject(ApiPaths.adminSystemHealth),);

  @override
  Future<Paginated<AdminApiKeyModel>> listApiKeys(ListQuery query) =>
      _client.getPaginated<AdminApiKeyModel>(
        ApiPaths.adminApiKeys, query, AdminApiKeyModel.fromJson,);

  @override
  Future<AdminApiKeyModel> getApiKey(String id) async =>
      AdminApiKeyModel.fromJson(
        await _client.getObject(ApiPaths.adminApiKey(id)),);

  @override
  Future<AdminApiKeyModel> createApiKey(Map<String, dynamic> payload) async =>
      AdminApiKeyModel.fromJson(
        await _client.post(ApiPaths.adminApiKeys, body: payload),);

  @override
  Future<void> deleteApiKey(String id) =>
      _client.delete(ApiPaths.adminApiKey(id));

  @override
  Future<Paginated<AdminTenantModel>> listTenants(ListQuery query) =>
      _client.getPaginated<AdminTenantModel>(
        ApiPaths.adminTenants, query, AdminTenantModel.fromJson,);

  @override
  Future<AdminTenantModel> getTenant(String id) async =>
      AdminTenantModel.fromJson(
        await _client.getObject(ApiPaths.adminTenant(id)),);

  @override
  Future<AdminTenantModel> createTenant(Map<String, dynamic> payload) async =>
      AdminTenantModel.fromJson(
        await _client.post(ApiPaths.adminTenants, body: payload),);
}
