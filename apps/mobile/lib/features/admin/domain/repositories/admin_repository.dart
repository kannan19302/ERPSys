import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/admin.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class AdminRepository {
  Future<Result<Cacheable<Paginated<AdminUser>>>> listUsers(ListQuery query);
  Future<Result<AdminUser>> getUser(String id);
  Future<Result<AdminUser>> createUser(Map<String, dynamic> payload);
  Future<Result<AdminUser>> updateUser(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteUser(String id);

  Future<Result<Cacheable<Paginated<AdminRole>>>> listRoles(ListQuery query);
  Future<Result<AdminRole>> getRole(String id);
  Future<Result<AdminRole>> createRole(Map<String, dynamic> payload);
  Future<Result<AdminRole>> updateRole(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteRole(String id);

  Future<Result<Cacheable<Paginated<AdminSetting>>>> listSettings(ListQuery query);
  Future<Result<AdminSetting>> updateSetting(String key, Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<AdminAuditLog>>>> listAuditLogs(ListQuery query);
  Future<Result<SystemHealth>> getSystemHealth();
}
