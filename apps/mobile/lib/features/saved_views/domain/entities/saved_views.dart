import 'package:equatable/equatable.dart';

class SavedView extends Equatable {
  const SavedView({
    required this.id,
    required this.name,
    required this.resourceType,
    this.description,
    required this.config,
    this.isDefault = false,
    this.isShared = false,
    this.ownerId,
    this.ownerName,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String resourceType;
  final String? description;
  final Map<String, dynamic> config;
  final bool isDefault;
  final bool isShared;
  final String? ownerId;
  final String? ownerName;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, resourceType, description, config, isDefault,
        isShared, ownerId, ownerName, createdAt, updatedAt,
      ];
}

class SavedViewShare extends Equatable {
  const SavedViewShare({
    required this.id,
    required this.savedViewId,
    required this.sharedWithId,
    required this.sharedWithName,
    this.permission = 'VIEW',
    this.createdAt,
  });

  final String id;
  final String savedViewId;
  final String sharedWithId;
  final String sharedWithName;
  final String permission;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, savedViewId, sharedWithId, sharedWithName, permission, createdAt,
      ];
}
