import 'package:equatable/equatable.dart';

class DriveFile extends Equatable {
  const DriveFile({
    required this.id,
    required this.name,
    required this.mimeType,
    required this.size,
    required this.storagePath,
    required this.ownerId,
    this.folderId,
    this.extension,
    this.checksum,
    this.description,
    this.isStarred = false,
    this.isDeleted = false,
    this.deletedAt,
    this.currentVersion = 1,
    this.metadata,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String mimeType;
  final int size;
  final String storagePath;
  final String ownerId;
  final String? folderId;
  final String? extension;
  final String? checksum;
  final String? description;
  final bool isStarred;
  final bool isDeleted;
  final DateTime? deletedAt;
  final int currentVersion;
  final Map<String, dynamic>? metadata;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, mimeType, size, storagePath, ownerId, folderId, extension,
        checksum, description, isStarred, isDeleted, deletedAt, currentVersion,
        metadata, createdAt, updatedAt,
      ];
}

class DriveFolder extends Equatable {
  const DriveFolder({
    required this.id,
    required this.name,
    required this.ownerId,
    this.parentId,
    this.description,
    this.color,
    this.icon,
    this.isStarred = false,
    this.isDeleted = false,
    this.deletedAt,
    this.path,
    this.size = 0,
    this.fileCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String ownerId;
  final String? parentId;
  final String? description;
  final String? color;
  final String? icon;
  final bool isStarred;
  final bool isDeleted;
  final DateTime? deletedAt;
  final String? path;
  final int size;
  final int fileCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, ownerId, parentId, description, color, icon, isStarred,
        isDeleted, deletedAt, path, size, fileCount, createdAt, updatedAt,
      ];
}

class DriveTrashItem extends Equatable {
  const DriveTrashItem({
    required this.id,
    required this.fileId,
    required this.deletedBy,
    this.originalPath,
    this.deletedAt,
  });

  final String id;
  final String fileId;
  final String deletedBy;
  final String? originalPath;
  final DateTime? deletedAt;

  @override
  List<Object?> get props => <Object?>[
        id, fileId, deletedBy, originalPath, deletedAt,
      ];
}

class DriveTag extends Equatable {
  const DriveTag({
    required this.id,
    required this.name,
    this.color = '#6366f1',
  });

  final String id;
  final String name;
  final String color;

  @override
  List<Object?> get props => <Object?>[id, name, color];
}
