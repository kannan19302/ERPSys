import 'package:equatable/equatable.dart';

class PwaPushSubscription extends Equatable {
  const PwaPushSubscription({
    required this.id,
    required this.userId,
    required this.endpoint,
    required this.p256dhKey,
    required this.authKey,
    this.userAgent,
    this.deviceType,
    this.browser,
    this.platform,
    this.tags = const <String>[],
    this.status = 'ACTIVE',
    this.lastPushedAt,
    this.expiresAt,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String userId;
  final String endpoint;
  final String p256dhKey;
  final String authKey;
  final String? userAgent;
  final String? deviceType;
  final String? browser;
  final String? platform;
  final List<String> tags;
  final String status;
  final DateTime? lastPushedAt;
  final DateTime? expiresAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, userId, endpoint, p256dhKey, authKey, userAgent, deviceType,
        browser, platform, tags, status, lastPushedAt, expiresAt, createdAt, updatedAt,
      ];
}

class PwaManifestConfig extends Equatable {
  const PwaManifestConfig({
    required this.id,
    required this.appName,
    required this.shortName,
    this.themeColor = '#000000',
    this.backgroundColor = '#ffffff',
    this.displayMode = 'standalone',
    this.startUrl = '/',
    this.icons = const <Map<String, dynamic>>[],
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String appName;
  final String shortName;
  final String themeColor;
  final String backgroundColor;
  final String displayMode;
  final String startUrl;
  final List<Map<String, dynamic>> icons;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, appName, shortName, themeColor, backgroundColor,
        displayMode, startUrl, icons, createdAt, updatedAt,
      ];
}

class PwaOfflineQueueItem extends Equatable {
  const PwaOfflineQueueItem({
    required this.id,
    this.userId,
    required this.actionType,
    required this.payload,
    this.status = 'PENDING',
    this.errorMessage,
    this.retryCount = 0,
    this.syncedAt,
    this.createdAt,
  });

  final String id;
  final String? userId;
  final String actionType;
  final Map<String, dynamic> payload;
  final String status;
  final String? errorMessage;
  final int retryCount;
  final DateTime? syncedAt;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, userId, actionType, payload, status,
        errorMessage, retryCount, syncedAt, createdAt,
      ];
}
