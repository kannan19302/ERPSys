import 'package:equatable/equatable.dart';

class DocumentFolder extends Equatable {
  const DocumentFolder({
    required this.id,
    required this.name,
    this.parentId,
    this.description,
    required this.documentCount,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String? parentId;
  final String? description;
  final int documentCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        parentId,
        description,
        documentCount,
        createdAt,
        updatedAt,
      ];
}

class Document extends Equatable {
  const Document({
    required this.id,
    required this.name,
    required this.folderId,
    this.folderName,
    required this.fileType,
    required this.fileSize,
    this.mimeType,
    this.description,
    required this.version,
    required this.status,
    this.category,
    required this.starred,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String folderId;
  final String? folderName;
  final String fileType;
  final int fileSize;
  final String? mimeType;
  final String? description;
  final int version;
  final String status;
  final String? category;
  final bool starred;
  final DateTime createdAt;
  final DateTime updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        folderId,
        folderName,
        fileType,
        fileSize,
        mimeType,
        description,
        version,
        status,
        category,
        starred,
        createdAt,
        updatedAt,
      ];
}

class DocumentVersion extends Equatable {
  const DocumentVersion({
    required this.id,
    required this.documentId,
    required this.versionNumber,
    required this.fileSize,
    this.uploadedBy,
    required this.createdAt,
  });

  final String id;
  final String documentId;
  final int versionNumber;
  final int fileSize;
  final String? uploadedBy;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        documentId,
        versionNumber,
        fileSize,
        uploadedBy,
        createdAt,
      ];
}

class DocumentTemplate extends Equatable {
  const DocumentTemplate({
    required this.id,
    required this.name,
    this.category,
    this.description,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String? category;
  final String? description;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        category,
        description,
        createdAt,
      ];
}
