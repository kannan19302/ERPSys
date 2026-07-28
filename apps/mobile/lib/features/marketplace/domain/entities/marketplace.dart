import 'package:equatable/equatable.dart';

class MarketplaceApp extends Equatable {
  const MarketplaceApp({
    required this.id,
    required this.name,
    this.description,
    this.developer,
    this.developerId,
    this.category,
    this.icon,
    this.price = 0,
    this.currency = 'USD',
    this.version,
    this.rating,
    this.downloadCount = 0,
    this.reviewCount = 0,
    this.status = 'PUBLISHED',
    this.permissions = const <String>[],
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final String? developer;
  final String? developerId;
  final String? category;
  final String? icon;
  final double price;
  final String currency;
  final String? version;
  final double? rating;
  final int downloadCount;
  final int reviewCount;
  final String status;
  final List<String> permissions;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, description, developer, developerId, category, icon,
        price, currency, version, rating, downloadCount, reviewCount,
        status, permissions, createdAt, updatedAt,
      ];
}

class MarketplaceReview extends Equatable {
  const MarketplaceReview({
    required this.id,
    this.appId,
    this.appName,
    this.userId,
    this.userName,
    this.rating = 0,
    this.comment,
    this.status = 'APPROVED',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String? appId;
  final String? appName;
  final String? userId;
  final String? userName;
  final double rating;
  final String? comment;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, appId, appName, userId, userName, rating, comment,
        status, createdAt, updatedAt,
      ];
}

class MarketplaceAppVersion extends Equatable {
  const MarketplaceAppVersion({
    required this.id,
    this.appId,
    this.appName,
    required this.version,
    this.releaseNotes,
    this.fileUrl,
    this.fileSize,
    this.status = 'DRAFT',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String? appId;
  final String? appName;
  final String version;
  final String? releaseNotes;
  final String? fileUrl;
  final int? fileSize;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, appId, appName, version, releaseNotes, fileUrl, fileSize,
        status, createdAt, updatedAt,
      ];
}

class MarketplaceSubmission extends Equatable {
  const MarketplaceSubmission({
    required this.id,
    this.appId,
    this.appName,
    this.submitterId,
    this.submitterName,
    this.type = 'NEW',
    this.notes,
    this.status = 'PENDING',
    this.reviewedBy,
    this.reviewDecision,
    this.reviewNotes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String? appId;
  final String? appName;
  final String? submitterId;
  final String? submitterName;
  final String type;
  final String? notes;
  final String status;
  final String? reviewedBy;
  final String? reviewDecision;
  final String? reviewNotes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, appId, appName, submitterId, submitterName, type, notes,
        status, reviewedBy, reviewDecision, reviewNotes, createdAt, updatedAt,
      ];
}