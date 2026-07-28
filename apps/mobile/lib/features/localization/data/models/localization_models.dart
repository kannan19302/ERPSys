import '../../../../core/error/exceptions.dart';
import '../../domain/entities/localization.dart';

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

class LocalizationTranslationModel extends LocalizationTranslation {
  const LocalizationTranslationModel({
    required super.id,
    super.locale,
    required super.key,
    required super.value,
    super.module,
    super.isOverride = false,
    super.createdAt,
    super.updatedAt,
  });

  factory LocalizationTranslationModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('LocalizationTranslation missing id');
    return LocalizationTranslationModel(
      id: id,
      locale: json['locale'] as String?,
      key: json['key'] as String? ?? '',
      value: json['value'] as String? ?? '',
      module: json['module'] as String?,
      isOverride: json['isOverride'] as bool? ?? false,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'locale': locale,
        'key': key,
        'value': value,
        'module': module,
        'isOverride': isOverride,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class LocalizationLanguageModel extends LocalizationLanguage {
  const LocalizationLanguageModel({
    required super.id,
    required super.code,
    required super.name,
    super.direction = 'ltr',
    super.isActive = true,
    super.isDefault = false,
    super.sortOrder = 0,
    super.createdAt,
    super.updatedAt,
  });

  factory LocalizationLanguageModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('LocalizationLanguage missing id');
    return LocalizationLanguageModel(
      id: id,
      code: json['code'] as String? ?? '',
      name: json['name'] as String? ?? '',
      direction: json['direction'] as String? ?? 'ltr',
      isActive: json['isActive'] as bool? ?? true,
      isDefault: json['isDefault'] as bool? ?? false,
      sortOrder: asInt(json['sortOrder']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'code': code,
        'name': name,
        'direction': direction,
        'isActive': isActive,
        'isDefault': isDefault,
        'sortOrder': sortOrder,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class LocalizationRegionModel extends LocalizationRegion {
  const LocalizationRegionModel({
    required super.id,
    required super.code,
    required super.name,
    super.locale,
    super.dateFormat = 'YYYY-MM-DD',
    super.timeFormat = 'HH:mm',
    super.timezone,
    super.currencyCode,
    super.createdAt,
    super.updatedAt,
  });

  factory LocalizationRegionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('LocalizationRegion missing id');
    return LocalizationRegionModel(
      id: id,
      code: json['code'] as String? ?? '',
      name: json['name'] as String? ?? '',
      locale: json['locale'] as String?,
      dateFormat: json['dateFormat'] as String? ?? 'YYYY-MM-DD',
      timeFormat: json['timeFormat'] as String? ?? 'HH:mm',
      timezone: json['timezone'] as String?,
      currencyCode: json['currencyCode'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'code': code,
        'name': name,
        'locale': locale,
        'dateFormat': dateFormat,
        'timeFormat': timeFormat,
        'timezone': timezone,
        'currencyCode': currencyCode,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}
