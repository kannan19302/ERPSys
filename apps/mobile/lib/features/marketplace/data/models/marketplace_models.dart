import '../../../../core/error/exceptions.dart';
import '../../domain/entities/marketplace.dart';

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

class MarketplaceAppModel extends MarketplaceApp {
  const MarketplaceAppModel({
    required super.id,
    required super.name,
    super.description,
    super.developer,
    super.developerId,
    super.category,
    super.icon,
    super.price = 0,
    super.currency = 'USD',
    super.version,
    super.rating,
    super.downloadCount = 0,
    super.reviewCount = 0,
    super.status = 'PUBLISHED',
    super.permissions = const <String>[],
    super.createdAt,
    super.updatedAt,
  });

  factory MarketplaceAppModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('MarketplaceApp missing id');
    return MarketplaceAppModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      developer: json['developer'] as String?,
      developerId: json['developerId'] as String?,
      category: json['category'] as String?,
      icon: json['icon'] as String?,
      price: asDouble(json['price']),
      currency: json['currency'] as String? ?? 'USD',
      version: json['version'] as String?,
      rating: asDouble(json['rating']),
      downloadCount: asInt(json['downloadCount']),
      reviewCount: asInt(json['reviewCount']),
      status: json['status'] as String? ?? 'PUBLISHED',
      permissions: (json['permissions'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList(growable: false) ??
          const [],
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'developer': developer,
        'developerId': developerId,
        'category': category,
        'icon': icon,
        'price': price,
        'currency': currency,
        'version': version,
        'rating': rating,
        'downloadCount': downloadCount,
        'reviewCount': reviewCount,
        'status': status,
        'permissions': permissions,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class MarketplaceReviewModel extends MarketplaceReview {
  const MarketplaceReviewModel({
    required super.id,
    super.appId,
    super.appName,
    super.userId,
    super.userName,
    super.rating = 0,
    super.comment,
    super.status = 'APPROVED',
    super.createdAt,
    super.updatedAt,
  });

  factory MarketplaceReviewModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('MarketplaceReview missing id');
    return MarketplaceReviewModel(
      id: id,
      appId: json['appId'] as String?,
      appName: json['appName'] as String?,
      userId: json['userId'] as String?,
      userName: json['userName'] as String?,
      rating: asDouble(json['rating']),
      comment: json['comment'] as String?,
      status: json['status'] as String? ?? 'APPROVED',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'appId': appId,
        'appName': appName,
        'userId': userId,
        'userName': userName,
        'rating': rating,
        'comment': comment,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class MarketplaceAppVersionModel extends MarketplaceAppVersion {
  const MarketplaceAppVersionModel({
    required super.id,
    super.appId,
    super.appName,
    required super.version,
    super.releaseNotes,
    super.fileUrl,
    super.fileSize,
    super.status = 'DRAFT',
    super.createdAt,
    super.updatedAt,
  });

  factory MarketplaceAppVersionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('MarketplaceAppVersion missing id');
    return MarketplaceAppVersionModel(
      id: id,
      appId: json['appId'] as String?,
      appName: json['appName'] as String?,
      version: json['version'] as String? ?? '',
      releaseNotes: json['releaseNotes'] as String?,
      fileUrl: json['fileUrl'] as String?,
      fileSize: asInt(json['fileSize']),
      status: json['status'] as String? ?? 'DRAFT',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'appId': appId,
        'appName': appName,
        'version': version,
        'releaseNotes': releaseNotes,
        'fileUrl': fileUrl,
        'fileSize': fileSize,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class MarketplaceSubmissionModel extends MarketplaceSubmission {
  const MarketplaceSubmissionModel({
    required super.id,
    super.appId,
    super.appName,
    super.submitterId,
    super.submitterName,
    super.type = 'NEW',
    super.notes,
    super.status = 'PENDING',
    super.reviewedBy,
    super.reviewDecision,
    super.reviewNotes,
    super.createdAt,
    super.updatedAt,
  });

  factory MarketplaceSubmissionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('MarketplaceSubmission missing id');
    return MarketplaceSubmissionModel(
      id: id,
      appId: json['appId'] as String?,
      appName: json['appName'] as String?,
      submitterId: json['submitterId'] as String?,
      submitterName: json['submitterName'] as String?,
      type: json['type'] as String? ?? 'NEW',
      notes: json['notes'] as String?,
      status: json['status'] as String? ?? 'PENDING',
      reviewedBy: json['reviewedBy'] as String?,
      reviewDecision: json['reviewDecision'] as String?,
      reviewNotes: json['reviewNotes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'appId': appId,
        'appName': appName,
        'submitterId': submitterId,
        'submitterName': submitterName,
        'type': type,
        'notes': notes,
        'status': status,
        'reviewedBy': reviewedBy,
        'reviewDecision': reviewDecision,
        'reviewNotes': reviewNotes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}