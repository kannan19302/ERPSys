import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/admin.dart';
import '../../domain/repositories/admin_repository.dart';
import '../datasources/admin_remote_data_source.dart';
import '../models/admin_models.dart';

class AdminRepositoryImpl implements AdminRepository {
  const AdminRepositoryImpl({
    required AdminRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _userNamespace = 'admin.users';
  static const String _roleNamespace = 'admin.roles';
  static const String _settingNamespace = 'admin.settings';
  static const String _auditNamespace = 'admin.audit-logs';

  final AdminRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final Paginated<T> page = await fetch();
      final List<Map<String, dynamic>> jsonItems = page.data
          .map((dynamic e) => (e as dynamic).toJson() as Map<String, dynamic>)
          .toList(growable: false);
      await _cache.write(_tenantId, namespace, query.cacheKey, <String, Object?>{
        'data': jsonItems,
        'meta': page.meta.toJson(),
      });
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: page),
      );
    } on NetworkException catch (error) {
      final cached = _cache.read<Map<String, dynamic>>(_tenantId, namespace, query.cacheKey);
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(cached.value, fromJson),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _single<T>(Future<T> Function() fetch) async {
    try {
      return Result<T>.ok(await fetch());
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _delete(Future<void> Function() action) async {
    try {
      await action();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _write<T>(Future<T> Function() action) async {
    try {
      final T result = await action();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<AdminUser>>>> listUsers(ListQuery q) =>
      _paginated(_userNamespace, q, () => _remote.listUsers(q),
        AdminUserModel.fromJson);

  @override
  Future<Result<AdminUser>> getUser(String id) =>
      _single(() => _remote.getUser(id));

  @override
  Future<Result<AdminUser>> createUser(Map<String, dynamic> p) =>
      _write(() => _remote.createUser(p));

  @override
  Future<Result<AdminUser>> updateUser(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateUser(id, p));

  @override
  Future<Result<void>> deleteUser(String id) =>
      _delete(() => _remote.deleteUser(id));

  @override
  Future<Result<Cacheable<Paginated<AdminRole>>>> listRoles(ListQuery q) =>
      _paginated(_roleNamespace, q, () => _remote.listRoles(q),
        AdminRoleModel.fromJson);

  @override
  Future<Result<AdminRole>> getRole(String id) =>
      _single(() => _remote.getRole(id));

  @override
  Future<Result<AdminRole>> createRole(Map<String, dynamic> p) =>
      _write(() => _remote.createRole(p));

  @override
  Future<Result<AdminRole>> updateRole(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateRole(id, p));

  @override
  Future<Result<void>> deleteRole(String id) =>
      _delete(() => _remote.deleteRole(id));

  @override
  Future<Result<Cacheable<Paginated<AdminSetting>>>> listSettings(ListQuery q) =>
      _paginated(_settingNamespace, q, () => _remote.listSettings(q),
        AdminSettingModel.fromJson);

  @override
  Future<Result<AdminSetting>> updateSetting(String key, Map<String, dynamic> p) =>
      _write(() => _remote.updateSetting(key, p));

  @override
  Future<Result<Cacheable<Paginated<AdminAuditLog>>>> listAuditLogs(ListQuery q) =>
      _paginated(_auditNamespace, q, () => _remote.listAuditLogs(q),
        AdminAuditLogModel.fromJson);

  @override
  Future<Result<SystemHealth>> getSystemHealth() =>
      _single(() => _remote.getSystemHealth());
}
