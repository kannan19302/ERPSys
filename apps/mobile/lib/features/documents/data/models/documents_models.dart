import '../../../../core/error/exceptions.dart';
import '../../domain/entities/documents.dart';

class DocumentFolderModel extends DocumentFolder {
  const DocumentFolderModel({
    required super.id,
    required super.name,
    super.parentId,
    super.description,
    required super.documentCount,
    required super.createdAt,
    required super.updatedAt,
  });

  factory DocumentFolderModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('DocumentFolder is missing its id');
    }
    return DocumentFolderModel(
      id: id,
      name: json['name'] as String? ?? '',
      parentId: json['parentId'] as String?,
      description: json['description'] as String?,
      documentCount: asInt(json['documentCount']),
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
      updatedAt: DateTime.tryParse('${json['updatedAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'parentId': parentId,
        'description': description,
        'documentCount': documentCount,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class DocumentModel extends Document {
  const DocumentModel({
    required super.id,
    required super.name,
    required super.folderId,
    super.folderName,
    required super.fileType,
    required super.fileSize,
    super.mimeType,
    super.description,
    required super.version,
    required super.status,
    super.category,
    required super.starred,
    required super.createdAt,
    required super.updatedAt,
  });

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Document is missing its id');
    }
    return DocumentModel(
      id: id,
      name: json['name'] as String? ?? '',
      folderId: json['folderId'] as String? ?? '',
      folderName: json['folderName'] as String?,
      fileType: json['fileType'] as String? ?? '',
      fileSize: asInt(json['fileSize']),
      mimeType: json['mimeType'] as String?,
      description: json['description'] as String?,
      version: asInt(json['version']),
      status: json['status'] as String? ?? 'ACTIVE',
      category: json['category'] as String?,
      starred: json['starred'] as bool? ?? false,
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
      updatedAt: DateTime.tryParse('${json['updatedAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'folderId': folderId,
        'folderName': folderName,
        'fileType': fileType,
        'fileSize': fileSize,
        'mimeType': mimeType,
        'description': description,
        'version': version,
        'status': status,
        'category': category,
        'starred': starred,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class DocumentVersionModel extends DocumentVersion {
  const DocumentVersionModel({
    required super.id,
    required super.documentId,
    required super.versionNumber,
    required super.fileSize,
    super.uploadedBy,
    required super.createdAt,
  });

  factory DocumentVersionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('DocumentVersion is missing its id');
    }
    return DocumentVersionModel(
      id: id,
      documentId: json['documentId'] as String? ?? '',
      versionNumber: asInt(json['versionNumber']),
      fileSize: asInt(json['fileSize']),
      uploadedBy: json['uploadedBy'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'documentId': documentId,
        'versionNumber': versionNumber,
        'fileSize': fileSize,
        'uploadedBy': uploadedBy,
        'createdAt': createdAt.toIso8601String(),
      };
}

class DocumentTemplateModel extends DocumentTemplate {
  const DocumentTemplateModel({
    required super.id,
    required super.name,
    super.category,
    super.description,
    required super.createdAt,
  });

  factory DocumentTemplateModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('DocumentTemplate is missing its id');
    }
    return DocumentTemplateModel(
      id: id,
      name: json['name'] as String? ?? '',
      category: json['category'] as String?,
      description: json['description'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'category': category,
        'description': description,
        'createdAt': createdAt.toIso8601String(),
      };
}

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
