import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/admin.dart';
import '../repositories/admin_repository.dart';

class ListAdminUsersUseCase extends UseCase<Cacheable<Paginated<AdminUser>>, ListQuery> {
  const ListAdminUsersUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AdminUser>>>> call(ListQuery params) =>
      _repository.listUsers(params);
}

class SaveAdminUserParams {
  const SaveAdminUserParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveAdminUserUseCase extends UseCase<AdminUser, SaveAdminUserParams> {
  const SaveAdminUserUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<AdminUser>> call(SaveAdminUserParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createUser(params.payload)
        : _repository.updateUser(id, params.payload);
  }
}

class DeleteAdminUserUseCase extends UseCase<void, String> {
  const DeleteAdminUserUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteUser(id);
}

class ListAdminRolesUseCase extends UseCase<Cacheable<Paginated<AdminRole>>, ListQuery> {
  const ListAdminRolesUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AdminRole>>>> call(ListQuery params) =>
      _repository.listRoles(params);
}

class SaveAdminRoleParams {
  const SaveAdminRoleParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveAdminRoleUseCase extends UseCase<AdminRole, SaveAdminRoleParams> {
  const SaveAdminRoleUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<AdminRole>> call(SaveAdminRoleParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createRole(params.payload)
        : _repository.updateRole(id, params.payload);
  }
}

class DeleteAdminRoleUseCase extends UseCase<void, String> {
  const DeleteAdminRoleUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteRole(id);
}

class GetAdminRoleUseCase extends UseCase<AdminRole, String> {
  const GetAdminRoleUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<AdminRole>> call(String id) => _repository.getRole(id);
}

class ListAdminSettingsUseCase extends UseCase<Cacheable<Paginated<AdminSetting>>, ListQuery> {
  const ListAdminSettingsUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AdminSetting>>>> call(ListQuery params) =>
      _repository.listSettings(params);
}

class UpdateAdminSettingUseCase extends UseCase<AdminSetting, Map<String, dynamic>> {
  const UpdateAdminSettingUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<AdminSetting>> call(Map<String, dynamic> params) =>
      _repository.updateSetting(params['key'] as String, params['value'] as Map<String, dynamic>);
}

class ListAdminAuditLogsUseCase extends UseCase<Cacheable<Paginated<AdminAuditLog>>, ListQuery> {
  const ListAdminAuditLogsUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AdminAuditLog>>>> call(ListQuery params) =>
      _repository.listAuditLogs(params);
}

class GetSystemHealthUseCase extends UseCase<SystemHealth, NoParams> {
  const GetSystemHealthUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<SystemHealth>> call(NoParams params) =>
      _repository.getSystemHealth();
}

class ListAdminApiKeysUseCase extends UseCase<Cacheable<Paginated<AdminApiKey>>, ListQuery> {
  const ListAdminApiKeysUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AdminApiKey>>>> call(ListQuery params) =>
      _repository.listApiKeys(params);
}

class GetAdminApiKeyUseCase extends UseCase<AdminApiKey, String> {
  const GetAdminApiKeyUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<AdminApiKey>> call(String id) => _repository.getApiKey(id);
}

class CreateAdminApiKeyUseCase extends UseCase<AdminApiKey, Map<String, dynamic>> {
  const CreateAdminApiKeyUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<AdminApiKey>> call(Map<String, dynamic> payload) =>
      _repository.createApiKey(payload);
}

class DeleteAdminApiKeyUseCase extends UseCase<void, String> {
  const DeleteAdminApiKeyUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteApiKey(id);
}

class ListAdminTenantsUseCase extends UseCase<Cacheable<Paginated<AdminTenant>>, ListQuery> {
  const ListAdminTenantsUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AdminTenant>>>> call(ListQuery params) =>
      _repository.listTenants(params);
}

class GetAdminTenantUseCase extends UseCase<AdminTenant, String> {
  const GetAdminTenantUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<AdminTenant>> call(String id) => _repository.getTenant(id);
}

class CreateAdminTenantUseCase extends UseCase<AdminTenant, Map<String, dynamic>> {
  const CreateAdminTenantUseCase(this._repository);
  final AdminRepository _repository;
  @override
  Future<Result<AdminTenant>> call(Map<String, dynamic> payload) =>
      _repository.createTenant(payload);
}
