import '../../../../core/error/exceptions.dart';
import '../../domain/entities/api_platform.dart';

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

class ApiKeyModel extends ApiKey {
  const ApiKeyModel({
    required super.id,
    required super.name,
    required super.prefix,
    super.rateLimit = 60,
    super.status = 'ACTIVE',
    super.scopes = const <String>[],
    super.ipWhitelist,
    super.expiresAt,
    super.createdAt,
    super.updatedAt,
  });

  factory ApiKeyModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ApiKey missing id');
    return ApiKeyModel(
      id: id,
      name: json['name'] as String? ?? '',
      prefix: json['prefix'] as String? ?? '',
      rateLimit: asInt(json['rateLimit']),
      status: json['status'] as String? ?? 'ACTIVE',
      scopes: (json['scopes'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList(growable: false) ?? const [],
      ipWhitelist: json['ipWhitelist'] as String?,
      expiresAt: DateTime.tryParse('${json['expiresAt']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'prefix': prefix,
        'rateLimit': rateLimit,
        'status': status,
        'scopes': scopes,
        'ipWhitelist': ipWhitelist,
        'expiresAt': expiresAt?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class WebhookEndpointModel extends WebhookEndpoint {
  const WebhookEndpointModel({
    required super.id,
    required super.name,
    required super.targetUrl,
    super.events = const <String>[],
    super.status = 'ACTIVE',
    super.createdAt,
    super.updatedAt,
  });

  factory WebhookEndpointModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('WebhookEndpoint missing id');
    return WebhookEndpointModel(
      id: id,
      name: json['name'] as String? ?? '',
      targetUrl: json['targetUrl'] as String? ?? '',
      events: (json['events'] as List<dynamic>?)?.cast<String>() ?? const [],
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'targetUrl': targetUrl,
        'events': events,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class ApiUsageLogModel extends ApiUsageLog {
  const ApiUsageLogModel({
    required super.id,
    super.apiKeyId,
    required super.endpoint,
    required super.method,
    required super.statusCode,
    required super.responseMs,
    super.createdAt,
  });

  factory ApiUsageLogModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ApiUsageLog missing id');
    return ApiUsageLogModel(
      id: id,
      apiKeyId: json['apiKeyId'] as String?,
      endpoint: json['endpoint'] as String? ?? '',
      method: json['method'] as String? ?? '',
      statusCode: asInt(json['statusCode']),
      responseMs: asInt(json['responseMs']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'apiKeyId': apiKeyId,
        'endpoint': endpoint,
        'method': method,
        'statusCode': statusCode,
        'responseMs': responseMs,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class ApiRateLimitRuleModel extends ApiRateLimitRule {
  const ApiRateLimitRuleModel({
    required super.id,
    required super.name,
    required super.endpointPath,
    super.limitPerMinute = 60,
    super.burstLimit = 100,
    super.clientTier = 'STANDARD',
    super.isActive = true,
    super.createdAt,
    super.updatedAt,
  });

  factory ApiRateLimitRuleModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('ApiRateLimitRule missing id');
    return ApiRateLimitRuleModel(
      id: id,
      name: json['name'] as String? ?? '',
      endpointPath: json['endpointPath'] as String? ?? '',
      limitPerMinute: asInt(json['limitPerMinute']),
      burstLimit: asInt(json['burstLimit']),
      clientTier: json['clientTier'] as String? ?? 'STANDARD',
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'endpointPath': endpointPath,
        'limitPerMinute': limitPerMinute,
        'burstLimit': burstLimit,
        'clientTier': clientTier,
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}
