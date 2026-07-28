import 'package:equatable/equatable.dart';

class ApiKey extends Equatable {
  const ApiKey({
    required this.id,
    required this.name,
    required this.prefix,
    this.rateLimit = 60,
    this.status = 'ACTIVE',
    this.scopes = const <String>[],
    this.ipWhitelist,
    this.expiresAt,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String prefix;
  final int rateLimit;
  final String status;
  final List<String> scopes;
  final String? ipWhitelist;
  final DateTime? expiresAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, prefix, rateLimit, status, scopes,
        ipWhitelist, expiresAt, createdAt, updatedAt,
      ];
}

class WebhookEndpoint extends Equatable {
  const WebhookEndpoint({
    required this.id,
    required this.name,
    required this.targetUrl,
    this.events = const <String>[],
    this.status = 'ACTIVE',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String targetUrl;
  final List<String> events;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, targetUrl, events, status, createdAt, updatedAt,
      ];
}

class ApiUsageLog extends Equatable {
  const ApiUsageLog({
    required this.id,
    this.apiKeyId,
    required this.endpoint,
    required this.method,
    required this.statusCode,
    required this.responseMs,
    this.createdAt,
  });

  final String id;
  final String? apiKeyId;
  final String endpoint;
  final String method;
  final int statusCode;
  final int responseMs;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, apiKeyId, endpoint, method, statusCode, responseMs, createdAt,
      ];
}

class ApiRateLimitRule extends Equatable {
  const ApiRateLimitRule({
    required this.id,
    required this.name,
    required this.endpointPath,
    this.limitPerMinute = 60,
    this.burstLimit = 100,
    this.clientTier = 'STANDARD',
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String endpointPath;
  final int limitPerMinute;
  final int burstLimit;
  final String clientTier;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, endpointPath, limitPerMinute, burstLimit,
        clientTier, isActive, createdAt, updatedAt,
      ];
}
