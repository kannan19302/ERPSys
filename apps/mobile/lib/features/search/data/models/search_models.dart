import '../../../../core/error/exceptions.dart';
import '../../domain/entities/search.dart';

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

class SearchResultModel extends SearchResult {
  const SearchResultModel({
    required super.id,
    required super.resourceType,
    required super.title,
    super.subtitle,
    super.description,
    super.resourceId,
    super.score,
    super.highlights,
    super.createdAt,
  });

  factory SearchResultModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SearchResult missing id');
    return SearchResultModel(
      id: id,
      resourceType: json['resourceType'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String?,
      description: json['description'] as String?,
      resourceId: json['resourceId'] as String?,
      score: asDouble(json['score']),
      highlights: json['highlights'] is Map<String, dynamic>
          ? (json['highlights'] as Map<String, dynamic>)
              .map((k, v) => MapEntry(k, '$v'))
          : null,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'resourceType': resourceType,
        'title': title,
        'subtitle': subtitle,
        'description': description,
        'resourceId': resourceId,
        'score': score,
        'highlights': highlights,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class SearchIndexConfigModel extends SearchIndexConfig {
  const SearchIndexConfigModel({
    required super.id,
    required super.resourceType,
    required super.fields,
    super.name,
    super.isActive = true,
    super.weight = 1.0,
    super.fuzzyLevel = 1,
    super.createdAt,
    super.updatedAt,
  });

  factory SearchIndexConfigModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SearchIndexConfig missing id');
    return SearchIndexConfigModel(
      id: id,
      resourceType: json['resourceType'] as String? ?? '',
      fields: (json['fields'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList(growable: false) ??
          const [],
      name: json['name'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      weight: asDouble(json['weight']),
      fuzzyLevel: asInt(json['fuzzyLevel']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'resourceType': resourceType,
        'fields': fields,
        'name': name,
        'isActive': isActive,
        'weight': weight,
        'fuzzyLevel': fuzzyLevel,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class SearchSynonymGroupModel extends SearchSynonymGroup {
  const SearchSynonymGroupModel({
    required super.id,
    required super.terms,
    super.locale,
    super.isActive = true,
    super.createdAt,
    super.updatedAt,
  });

  factory SearchSynonymGroupModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SearchSynonymGroup missing id');
    return SearchSynonymGroupModel(
      id: id,
      terms: (json['terms'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList(growable: false) ??
          const [],
      locale: json['locale'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'terms': terms,
        'locale': locale,
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}
