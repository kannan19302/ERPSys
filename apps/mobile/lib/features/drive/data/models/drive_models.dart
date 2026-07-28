import '../../../../core/error/exceptions.dart';
import '../../domain/entities/drive.dart';

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

class DriveFileModel extends DriveFile {
  const DriveFileModel({
    required super.id,
    required super.name,
    required super.mimeType,
    required super.size,
    required super.storagePath,
    required super.ownerId,
    super.folderId,
    super.extension,
    super.checksum,
    super.description,
    super.isStarred = false,
    super.isDeleted = false,
    super.deletedAt,
    super.currentVersion = 1,
    super.metadata,
    super.createdAt,
    super.updatedAt,
  });

  factory DriveFileModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('DriveFile missing id');
    return DriveFileModel(
      id: id,
      name: json['name'] as String? ?? '',
      mimeType: json['mimeType'] as String? ?? '',
      size: asInt(json['size']),
      storagePath: json['storagePath'] as String? ?? '',
      ownerId: json['ownerId'] as String? ?? '',
      folderId: json['folderId'] as String?,
      extension: json['extension'] as String?,
      checksum: json['checksum'] as String?,
      description: json['description'] as String?,
      isStarred: json['isStarred'] as bool? ?? false,
      isDeleted: json['isDeleted'] as bool? ?? false,
      deletedAt: DateTime.tryParse('${json['deletedAt']}'),
      currentVersion: asInt(json['currentVersion']),
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'mimeType': mimeType,
        'size': size,
        'storagePath': storagePath,
        'ownerId': ownerId,
        'folderId': folderId,
        'extension': extension,
        'checksum': checksum,
        'description': description,
        'isStarred': isStarred,
        'isDeleted': isDeleted,
        'deletedAt': deletedAt?.toIso8601String(),
        'currentVersion': currentVersion,
        'metadata': metadata,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class DriveFolderModel extends DriveFolder {
  const DriveFolderModel({
    required super.id,
    required super.name,
    required super.ownerId,
    super.parentId,
    super.description,
    super.color,
    super.icon,
    super.isStarred = false,
    super.isDeleted = false,
    super.deletedAt,
    super.path,
    super.size = 0,
    super.fileCount = 0,
    super.createdAt,
    super.updatedAt,
  });

  factory DriveFolderModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('DriveFolder missing id');
    return DriveFolderModel(
      id: id,
      name: json['name'] as String? ?? '',
      ownerId: json['ownerId'] as String? ?? '',
      parentId: json['parentId'] as String?,
      description: json['description'] as String?,
      color: json['color'] as String?,
      icon: json['icon'] as String?,
      isStarred: json['isStarred'] as bool? ?? false,
      isDeleted: json['isDeleted'] as bool? ?? false,
      deletedAt: DateTime.tryParse('${json['deletedAt']}'),
      path: json['path'] as String?,
      size: asInt(json['size']),
      fileCount: asInt(json['fileCount']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'ownerId': ownerId,
        'parentId': parentId,
        'description': description,
        'color': color,
        'icon': icon,
        'isStarred': isStarred,
        'isDeleted': isDeleted,
        'deletedAt': deletedAt?.toIso8601String(),
        'path': path,
        'size': size,
        'fileCount': fileCount,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class DriveTrashItemModel extends DriveTrashItem {
  const DriveTrashItemModel({
    required super.id,
    required super.fileId,
    required super.deletedBy,
    super.originalPath,
    super.deletedAt,
  });

  factory DriveTrashItemModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('DriveTrashItem missing id');
    return DriveTrashItemModel(
      id: id,
      fileId: json['fileId'] as String? ?? '',
      deletedBy: json['deletedBy'] as String? ?? '',
      originalPath: json['originalPath'] as String?,
      deletedAt: DateTime.tryParse('${json['deletedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'fileId': fileId,
        'deletedBy': deletedBy,
        'originalPath': originalPath,
        'deletedAt': deletedAt?.toIso8601String(),
      };
}

class DriveTagModel extends DriveTag {
  const DriveTagModel({
    required super.id,
    required super.name,
    super.color = '#6366f1',
  });

  factory DriveTagModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('DriveTag missing id');
    return DriveTagModel(
      id: id,
      name: json['name'] as String? ?? '',
      color: json['color'] as String? ?? '#6366f1',
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'color': color,
      };
}
