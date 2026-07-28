import '../../../../core/error/exceptions.dart';
import '../../domain/entities/saved_views.dart';

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

class SavedViewModel extends SavedView {
  const SavedViewModel({
    required super.id,
    required super.name,
    required super.resourceType,
    super.description,
    required super.config,
    super.isDefault = false,
    super.isShared = false,
    super.ownerId,
    super.ownerName,
    super.createdAt,
    super.updatedAt,
  });

  factory SavedViewModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SavedView missing id');
    return SavedViewModel(
      id: id,
      name: json['name'] as String? ?? '',
      resourceType: json['resourceType'] as String? ?? '',
      description: json['description'] as String?,
      config: json['config'] is Map<String, dynamic>
          ? json['config'] as Map<String, dynamic>
          : <String, dynamic>{},
      isDefault: json['isDefault'] as bool? ?? false,
      isShared: json['isShared'] as bool? ?? false,
      ownerId: json['ownerId'] as String?,
      ownerName: json['ownerName'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'resourceType': resourceType,
        'description': description,
        'config': config,
        'isDefault': isDefault,
        'isShared': isShared,
        'ownerId': ownerId,
        'ownerName': ownerName,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class SavedViewShareModel extends SavedViewShare {
  const SavedViewShareModel({
    required super.id,
    required super.savedViewId,
    required super.sharedWithId,
    required super.sharedWithName,
    super.permission = 'VIEW',
    super.createdAt,
  });

  factory SavedViewShareModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SavedViewShare missing id');
    return SavedViewShareModel(
      id: id,
      savedViewId: json['savedViewId'] as String? ?? '',
      sharedWithId: json['sharedWithId'] as String? ?? '',
      sharedWithName: json['sharedWithName'] as String? ?? '',
      permission: json['permission'] as String? ?? 'VIEW',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'savedViewId': savedViewId,
        'sharedWithId': sharedWithId,
        'sharedWithName': sharedWithName,
        'permission': permission,
        'createdAt': createdAt?.toIso8601String(),
      };
}
