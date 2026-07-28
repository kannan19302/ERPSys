import 'package:equatable/equatable.dart';

class SearchResult extends Equatable {
  const SearchResult({
    required this.id,
    required this.resourceType,
    required this.title,
    this.subtitle,
    this.description,
    this.resourceId,
    this.score,
    this.highlights,
    this.createdAt,
  });

  final String id;
  final String resourceType;
  final String title;
  final String? subtitle;
  final String? description;
  final String? resourceId;
  final double? score;
  final Map<String, String>? highlights;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, resourceType, title, subtitle, description, resourceId,
        score, highlights, createdAt,
      ];
}

class SearchIndexConfig extends Equatable {
  const SearchIndexConfig({
    required this.id,
    required this.resourceType,
    required this.fields,
    this.name,
    this.isActive = true,
    this.weight = 1.0,
    this.fuzzyLevel = 1,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String resourceType;
  final List<String> fields;
  final String? name;
  final bool isActive;
  final double weight;
  final int fuzzyLevel;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, resourceType, fields, name, isActive, weight,
        fuzzyLevel, createdAt, updatedAt,
      ];
}

class SearchSynonymGroup extends Equatable {
  const SearchSynonymGroup({
    required this.id,
    required this.terms,
    this.locale,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final List<String> terms;
  final String? locale;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, terms, locale, isActive, createdAt, updatedAt,
      ];
}
