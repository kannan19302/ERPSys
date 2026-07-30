import '../../../../core/error/exceptions.dart';
import '../../domain/entities/admin.dart';

double asDouble(Object? value) => switch (value) {
      final num v => v.toDouble(),
      final String v => double.tryParse(v) ?? 0,
      _ => 0,
    };

int asInt(Object? value) => switch (value) {
      final int v => v,
      final num v => v.toInt(),
      final String v => int.tryParse(v) ?? 0,
      _ => 0,
    };

bool asBool(Object? value) => switch (value) {
      final bool v => v,
      final String v => v == 'true',
      final int v => v == 1,
      _ => false,
    };

class AdminUserModel extends AdminUser {
  const AdminUserModel({
    required super.id,
    required super.email,
    required super.firstName,
    required super.lastName,
    super.avatar,
    super.status = 'ACTIVE',
    super.lastLoginAt,
    super.roles = const <String>[],
    super.createdAt,
    super.updatedAt,
  });

  factory AdminUserModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AdminUser missing id');
    return AdminUserModel(
      id: id,
      email: json['email'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      avatar: json['avatar'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      lastLoginAt: DateTime.tryParse('${json['lastLoginAt']}'),
      roles: (json['roles'] as List<dynamic>?)?.map((e) => e.toString()).toList(growable: false) ?? const [],
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'avatar': avatar,
        'status': status,
        'lastLoginAt': lastLoginAt?.toIso8601String(),
        'roles': roles,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class AdminRoleModel extends AdminRole {
  const AdminRoleModel({
    required super.id,
    required super.name,
    super.description,
    super.isSystem = false,
    super.permissions = const <String>[],
    super.userCount = 0,
    super.createdAt,
    super.updatedAt,
  });

  factory AdminRoleModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AdminRole missing id');
    return AdminRoleModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      isSystem: json['isSystem'] as bool? ?? false,
      permissions: (json['permissions'] as List<dynamic>?)?.cast<String>() ?? const [],
      userCount: asInt(json['userCount']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'isSystem': isSystem,
        'permissions': permissions,
        'userCount': userCount,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class AdminSettingModel extends AdminSetting {
  const AdminSettingModel({
    required super.id,
    required super.key,
    super.value,
    super.type = 'string',
    super.category = 'general',
    super.description,
    super.isEncrypted = false,
    super.createdAt,
    super.updatedAt,
  });

  factory AdminSettingModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AdminSetting missing id');
    return AdminSettingModel(
      id: id,
      key: json['key'] as String? ?? '',
      value: json['value'],
      type: json['type'] as String? ?? 'string',
      category: json['category'] as String? ?? 'general',
      description: json['description'] as String?,
      isEncrypted: json['isEncrypted'] as bool? ?? false,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'key': key,
        'value': value,
        'type': type,
        'category': category,
        'description': description,
        'isEncrypted': isEncrypted,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class AdminAuditLogModel extends AdminAuditLog {
  const AdminAuditLogModel({
    required super.id,
    required super.userId,
    required super.action,
    required super.entityType,
    required super.entityId,
    super.changes,
    super.ipAddress,
    super.userAgent,
    super.createdAt,
  });

  factory AdminAuditLogModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AdminAuditLog missing id');
    return AdminAuditLogModel(
      id: id,
      userId: json['userId'] as String? ?? '',
      action: json['action'] as String? ?? '',
      entityType: json['entityType'] as String? ?? '',
      entityId: json['entityId'] as String? ?? '',
      changes: json['changes'] as Map<String, dynamic>?,
      ipAddress: json['ipAddress'] as String?,
      userAgent: json['userAgent'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'userId': userId,
        'action': action,
        'entityType': entityType,
        'entityId': entityId,
        'changes': changes,
        'ipAddress': ipAddress,
        'userAgent': userAgent,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class SystemHealthModel extends SystemHealth {
  const SystemHealthModel({
    required super.id,
    super.status = 'OK',
    super.uptimeSeconds = 0,
    super.activeUsers = 0,
    super.apiLatencyMs,
    super.dbLatencyMs,
    super.cacheHitRate,
    super.storageUsedMb = 0,
    super.memoryUsageMb,
    super.cpuUsagePercent,
    super.lastChecked,
    super.createdAt,
  });

  factory SystemHealthModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SystemHealth missing id');
    return SystemHealthModel(
      id: id,
      status: json['status'] as String? ?? 'OK',
      uptimeSeconds: asInt(json['uptimeSeconds']),
      activeUsers: asInt(json['activeUsers']),
      apiLatencyMs: asDouble(json['apiLatencyMs']),
      dbLatencyMs: asDouble(json['dbLatencyMs']),
      cacheHitRate: asDouble(json['cacheHitRate']),
      storageUsedMb: asInt(json['storageUsedMb']),
      memoryUsageMb: asDouble(json['memoryUsageMb']),
      cpuUsagePercent: asDouble(json['cpuUsagePercent']),
      lastChecked: DateTime.tryParse('${json['lastChecked']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'status': status,
        'uptimeSeconds': uptimeSeconds,
        'activeUsers': activeUsers,
        'apiLatencyMs': apiLatencyMs,
        'dbLatencyMs': dbLatencyMs,
        'cacheHitRate': cacheHitRate,
        'storageUsedMb': storageUsedMb,
        'memoryUsageMb': memoryUsageMb,
        'cpuUsagePercent': cpuUsagePercent,
        'lastChecked': lastChecked?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

class AdminApiKeyModel extends AdminApiKey {
  const AdminApiKeyModel({
    required super.id,
    required super.name,
    super.key,
    super.permissions = const <String>[],
    super.lastUsedAt,
    super.expiresAt,
    super.isActive = true,
    super.createdAt,
  });

  factory AdminApiKeyModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AdminApiKey missing id');
    return AdminApiKeyModel(
      id: id,
      name: json['name'] as String? ?? '',
      key: json['key'] as String?,
      permissions: (json['permissions'] as List<dynamic>?)?.cast<String>() ?? const [],
      lastUsedAt: DateTime.tryParse('${json['lastUsedAt']}'),
      expiresAt: DateTime.tryParse('${json['expiresAt']}'),
      isActive: asBool(json['isActive']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'key': key,
        'permissions': permissions,
        'lastUsedAt': lastUsedAt?.toIso8601String(),
        'expiresAt': expiresAt?.toIso8601String(),
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class AdminTenantModel extends AdminTenant {
  const AdminTenantModel({
    required super.id,
    required super.name,
    required super.slug,
    super.domain,
    super.plan = 'free',
    super.status = 'ACTIVE',
    super.userCount = 0,
    super.createdAt,
  });

  factory AdminTenantModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('AdminTenant missing id');
    return AdminTenantModel(
      id: id,
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      domain: json['domain'] as String?,
      plan: json['plan'] as String? ?? 'free',
      status: json['status'] as String? ?? 'ACTIVE',
      userCount: asInt(json['userCount']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'slug': slug,
        'domain': domain,
        'plan': plan,
        'status': status,
        'userCount': userCount,
        'createdAt': createdAt?.toIso8601String(),
      };
}
