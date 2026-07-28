import 'package:equatable/equatable.dart';

class StorageBucket extends Equatable {
  const StorageBucket({
    required this.id,
    required this.bucketName,
    this.provider = 'S3',
    this.region = 'us-east-1',
    this.maxQuotaGb = 100,
    this.currentSizeGb = 0,
    this.isPublic = false,
    this.versioning = true,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String bucketName;
  final String provider;
  final String region;
  final int maxQuotaGb;
  final double currentSizeGb;
  final bool isPublic;
  final bool versioning;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, bucketName, provider, region, maxQuotaGb, currentSizeGb,
        isPublic, versioning, createdAt, updatedAt,
      ];
}

class StorageFile extends Equatable {
  const StorageFile({
    required this.id,
    required this.name,
    required this.bucket,
    required this.fileKey,
    this.size = 0,
    this.mimeType,
    this.folderId,
    this.createdBy,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String bucket;
  final String fileKey;
  final int size;
  final String? mimeType;
  final String? folderId;
  final String? createdBy;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, bucket, fileKey, size, mimeType,
        folderId, createdBy, createdAt, updatedAt,
      ];
}

class StoragePolicy extends Equatable {
  const StoragePolicy({
    required this.id,
    required this.bucketName,
    this.roleOrUser,
    this.permission = 'READ',
    this.allowedIpSubnet,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String bucketName;
  final String? roleOrUser;
  final String permission;
  final String? allowedIpSubnet;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, bucketName, roleOrUser, permission, allowedIpSubnet, createdAt, updatedAt,
      ];
}
