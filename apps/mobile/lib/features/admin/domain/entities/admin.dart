import 'package:equatable/equatable.dart';

class AdminUser extends Equatable {
  const AdminUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.avatar,
    this.status = 'ACTIVE',
    this.lastLoginAt,
    this.roles = const <String>[],
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? avatar;
  final String status;
  final DateTime? lastLoginAt;
  final List<String> roles;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  String get fullName => '$firstName $lastName';

  @override
  List<Object?> get props => <Object?>[
        id, email, firstName, lastName, avatar, status,
        lastLoginAt, roles, createdAt, updatedAt,
      ];
}

class AdminRole extends Equatable {
  const AdminRole({
    required this.id,
    required this.name,
    this.description,
    this.isSystem = false,
    this.permissions = const <String>[],
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final bool isSystem;
  final List<String> permissions;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, description, isSystem, permissions, createdAt, updatedAt,
      ];
}

class AdminSetting extends Equatable {
  const AdminSetting({
    required this.id,
    required this.key,
    this.value,
    this.category = 'general',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String key;
  final Object? value;
  final String category;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, key, value, category, createdAt, updatedAt,
      ];
}

class AdminAuditLog extends Equatable {
  const AdminAuditLog({
    required this.id,
    required this.userId,
    required this.action,
    required this.entityType,
    required this.entityId,
    this.changes,
    this.ipAddress,
    this.userAgent,
    this.createdAt,
  });

  final String id;
  final String userId;
  final String action;
  final String entityType;
  final String entityId;
  final Map<String, dynamic>? changes;
  final String? ipAddress;
  final String? userAgent;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, userId, action, entityType, entityId,
        changes, ipAddress, userAgent, createdAt,
      ];
}

class SystemHealth extends Equatable {
  const SystemHealth({
    required this.id,
    this.status = 'OK',
    this.uptimeSeconds = 0,
    this.activeUsers = 0,
    this.apiLatencyMs,
    this.dbLatencyMs,
    this.cacheHitRate,
    this.storageUsedMb = 0,
    this.memoryUsageMb,
    this.cpuUsagePercent,
    this.lastChecked,
    this.createdAt,
  });

  final String id;
  final String status;
  final int uptimeSeconds;
  final int activeUsers;
  final double? apiLatencyMs;
  final double? dbLatencyMs;
  final double? cacheHitRate;
  final int storageUsedMb;
  final double? memoryUsageMb;
  final double? cpuUsagePercent;
  final DateTime? lastChecked;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, status, uptimeSeconds, activeUsers, apiLatencyMs, dbLatencyMs,
        cacheHitRate, storageUsedMb, memoryUsageMb, cpuUsagePercent, lastChecked, createdAt,
      ];
}
