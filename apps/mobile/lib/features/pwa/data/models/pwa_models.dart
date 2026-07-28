import '../../../../core/error/exceptions.dart';
import '../../domain/entities/pwa.dart';

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

class PwaPushSubscriptionModel extends PwaPushSubscription {
  const PwaPushSubscriptionModel({
    required super.id,
    required super.userId,
    required super.endpoint,
    required super.p256dhKey,
    required super.authKey,
    super.userAgent,
    super.deviceType,
    super.browser,
    super.platform,
    super.tags = const <String>[],
    super.status = 'ACTIVE',
    super.lastPushedAt,
    super.expiresAt,
    super.createdAt,
    super.updatedAt,
  });

  factory PwaPushSubscriptionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PwaPushSubscription missing id');
    return PwaPushSubscriptionModel(
      id: id,
      userId: json['userId'] as String? ?? '',
      endpoint: json['endpoint'] as String? ?? '',
      p256dhKey: json['p256dhKey'] as String? ?? '',
      authKey: json['authKey'] as String? ?? '',
      userAgent: json['userAgent'] as String?,
      deviceType: json['deviceType'] as String?,
      browser: json['browser'] as String?,
      platform: json['platform'] as String?,
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? const [],
      status: json['status'] as String? ?? 'ACTIVE',
      lastPushedAt: DateTime.tryParse('${json['lastPushedAt']}'),
      expiresAt: DateTime.tryParse('${json['expiresAt']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'userId': userId,
        'endpoint': endpoint,
        'p256dhKey': p256dhKey,
        'authKey': authKey,
        'userAgent': userAgent,
        'deviceType': deviceType,
        'browser': browser,
        'platform': platform,
        'tags': tags,
        'status': status,
        'lastPushedAt': lastPushedAt?.toIso8601String(),
        'expiresAt': expiresAt?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PwaManifestConfigModel extends PwaManifestConfig {
  const PwaManifestConfigModel({
    required super.id,
    required super.appName,
    required super.shortName,
    super.themeColor = '#000000',
    super.backgroundColor = '#ffffff',
    super.displayMode = 'standalone',
    super.startUrl = '/',
    super.icons = const <Map<String, dynamic>>[],
    super.createdAt,
    super.updatedAt,
  });

  factory PwaManifestConfigModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PwaManifestConfig missing id');
    return PwaManifestConfigModel(
      id: id,
      appName: json['appName'] as String? ?? '',
      shortName: json['shortName'] as String? ?? '',
      themeColor: json['themeColor'] as String? ?? '#000000',
      backgroundColor: json['backgroundColor'] as String? ?? '#ffffff',
      displayMode: json['displayMode'] as String? ?? 'standalone',
      startUrl: json['startUrl'] as String? ?? '/',
      icons: (json['icons'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList(growable: false) ??
          const [],
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'appName': appName,
        'shortName': shortName,
        'themeColor': themeColor,
        'backgroundColor': backgroundColor,
        'displayMode': displayMode,
        'startUrl': startUrl,
        'icons': icons,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PwaOfflineQueueItemModel extends PwaOfflineQueueItem {
  const PwaOfflineQueueItemModel({
    required super.id,
    super.userId,
    required super.actionType,
    required super.payload,
    super.status = 'PENDING',
    super.errorMessage,
    super.retryCount = 0,
    super.syncedAt,
    super.createdAt,
  });

  factory PwaOfflineQueueItemModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PwaOfflineQueueItem missing id');
    return PwaOfflineQueueItemModel(
      id: id,
      userId: json['userId'] as String?,
      actionType: json['actionType'] as String? ?? '',
      payload: (json['payload'] as Map<String, dynamic>?) ?? const {},
      status: json['status'] as String? ?? 'PENDING',
      errorMessage: json['errorMessage'] as String?,
      retryCount: asInt(json['retryCount']),
      syncedAt: DateTime.tryParse('${json['syncedAt']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'userId': userId,
        'actionType': actionType,
        'payload': payload,
        'status': status,
        'errorMessage': errorMessage,
        'retryCount': retryCount,
        'syncedAt': syncedAt?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}
