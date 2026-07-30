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
    this.userCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final bool isSystem;
  final List<String> permissions;
  final int userCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, description, isSystem, permissions, userCount, createdAt, updatedAt,
      ];
}

class AdminSetting extends Equatable {
  const AdminSetting({
    required this.id,
    required this.key,
    this.value,
    this.type = 'string',
    this.category = 'general',
    this.description,
    this.isEncrypted = false,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String key;
  final Object? value;
  final String type;
  final String category;
  final String? description;
  final bool isEncrypted;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, key, value, type, category, description, isEncrypted, createdAt, updatedAt,
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

class AdminApiKey extends Equatable {
  const AdminApiKey({
    required this.id,
    required this.name,
    this.key,
    this.permissions = const <String>[],
    this.lastUsedAt,
    this.expiresAt,
    this.isActive = true,
    this.createdAt,
  });

  final String id;
  final String name;
  final String? key;
  final List<String> permissions;
  final DateTime? lastUsedAt;
  final DateTime? expiresAt;
  final bool isActive;
  final DateTime? createdAt;

  String? get maskedKey => key != null && key!.length > 8
      ? '${key!.substring(0, 4)}${'*' * (key!.length - 8)}${key!.substring(key!.length - 4)}'
      : key;

  @override
  List<Object?> get props => <Object?>[
        id, name, key, permissions, lastUsedAt, expiresAt, isActive, createdAt,
      ];
}

class AdminTenant extends Equatable {
  const AdminTenant({
    required this.id,
    required this.name,
    required this.slug,
    this.domain,
    this.plan = 'free',
    this.status = 'ACTIVE',
    this.userCount = 0,
    this.createdAt,
  });

  final String id;
  final String name;
  final String slug;
  final String? domain;
  final String plan;
  final String status;
  final int userCount;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, slug, domain, plan, status, userCount, createdAt,
      ];
}
