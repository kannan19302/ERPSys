import 'package:equatable/equatable.dart';

class LocalizationTranslation extends Equatable {
  const LocalizationTranslation({
    required this.id,
    this.locale,
    required this.key,
    required this.value,
    this.module,
    this.isOverride = false,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String? locale;
  final String key;
  final String value;
  final String? module;
  final bool isOverride;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, locale, key, value, module, isOverride, createdAt, updatedAt,
      ];
}

class LocalizationLanguage extends Equatable {
  const LocalizationLanguage({
    required this.id,
    required this.code,
    required this.name,
    this.direction = 'ltr',
    this.isActive = true,
    this.isDefault = false,
    this.sortOrder = 0,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String code;
  final String name;
  final String direction;
  final bool isActive;
  final bool isDefault;
  final int sortOrder;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, code, name, direction, isActive, isDefault, sortOrder, createdAt, updatedAt,
      ];
}

class LocalizationRegion extends Equatable {
  const LocalizationRegion({
    required this.id,
    required this.code,
    required this.name,
    this.locale,
    this.dateFormat = 'YYYY-MM-DD',
    this.timeFormat = 'HH:mm',
    this.timezone,
    this.currencyCode,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String code;
  final String name;
  final String? locale;
  final String dateFormat;
  final String timeFormat;
  final String? timezone;
  final String? currencyCode;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, code, name, locale, dateFormat, timeFormat, timezone, currencyCode, createdAt, updatedAt,
      ];
}
