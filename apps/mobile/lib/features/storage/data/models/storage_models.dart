import '../../../../core/error/exceptions.dart';
import '../../domain/entities/storage.dart';

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

class StorageBucketModel extends StorageBucket {
  const StorageBucketModel({
    required super.id,
    required super.bucketName,
    super.provider = 'S3',
    super.region = 'us-east-1',
    super.maxQuotaGb = 100,
    super.currentSizeGb = 0,
    super.isPublic = false,
    super.versioning = true,
    super.createdAt,
    super.updatedAt,
  });

  factory StorageBucketModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('StorageBucket missing id');
    return StorageBucketModel(
      id: id,
      bucketName: json['bucketName'] as String? ?? '',
      provider: json['provider'] as String? ?? 'S3',
      region: json['region'] as String? ?? 'us-east-1',
      maxQuotaGb: asInt(json['maxQuotaGb']),
      currentSizeGb: asDouble(json['currentSizeGb']),
      isPublic: json['isPublic'] as bool? ?? false,
      versioning: json['versioning'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'bucketName': bucketName,
        'provider': provider,
        'region': region,
        'maxQuotaGb': maxQuotaGb,
        'currentSizeGb': currentSizeGb,
        'isPublic': isPublic,
        'versioning': versioning,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class StorageFileModel extends StorageFile {
  const StorageFileModel({
    required super.id,
    required super.name,
    required super.bucket,
    required super.fileKey,
    super.size = 0,
    super.mimeType,
    super.folderId,
    super.createdBy,
    super.createdAt,
    super.updatedAt,
  });

  factory StorageFileModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('StorageFile missing id');
    return StorageFileModel(
      id: id,
      name: json['name'] as String? ?? '',
      bucket: json['bucket'] as String? ?? '',
      fileKey: json['fileKey'] as String? ?? '',
      size: asInt(json['size']),
      mimeType: json['mimeType'] as String?,
      folderId: json['folderId'] as String?,
      createdBy: json['createdBy'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'bucket': bucket,
        'fileKey': fileKey,
        'size': size,
        'mimeType': mimeType,
        'folderId': folderId,
        'createdBy': createdBy,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class StoragePolicyModel extends StoragePolicy {
  const StoragePolicyModel({
    required super.id,
    required super.bucketName,
    super.roleOrUser,
    super.permission = 'READ',
    super.allowedIpSubnet,
    super.createdAt,
    super.updatedAt,
  });

  factory StoragePolicyModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('StoragePolicy missing id');
    return StoragePolicyModel(
      id: id,
      bucketName: json['bucketName'] as String? ?? '',
      roleOrUser: json['roleOrUser'] as String?,
      permission: json['permission'] as String? ?? 'READ',
      allowedIpSubnet: json['allowedIpSubnet'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'bucketName': bucketName,
        'roleOrUser': roleOrUser,
        'permission': permission,
        'allowedIpSubnet': allowedIpSubnet,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}
