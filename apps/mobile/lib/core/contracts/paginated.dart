/// Dart mirror of the FROZEN list/pagination contract.
///
/// Source of truth: `packages/shared/src/contracts/pagination.ts` and
/// `apps/api/src/common/utils/pagination.util.ts`:
///
///   query:    ?page=&limit=&sort=&search=  (plus per-endpoint filters)
///   response: { data: T[], meta: { page, limit, total, totalPages } }
library;

const int kListLimitDefault = 25;
const int kListLimitMax = 100;

class PaginationMeta {
  const PaginationMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic> json) => PaginationMeta(
        page: _int(json['page'], 1),
        limit: _int(json['limit'], kListLimitDefault),
        total: _int(json['total'], 0),
        totalPages: _int(json['totalPages'], 0),
      );

  final int page;
  final int limit;
  final int total;
  final int totalPages;

  bool get hasMore => page < totalPages;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'page': page,
        'limit': limit,
        'total': total,
        'totalPages': totalPages,
      };

  static int _int(Object? value, int fallback) => switch (value) {
        final int v => v,
        final num v => v.toInt(),
        final String v => int.tryParse(v) ?? fallback,
        _ => fallback,
      };
}

class Paginated<T> {
  const Paginated({required this.data, required this.meta});

  factory Paginated.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) itemFromJson,
  ) {
    final Object? raw = json['data'];
    final List<T> items = raw is List
        ? raw
            .whereType<Map<String, dynamic>>()
            .map(itemFromJson)
            .toList(growable: false)
        : const <Never>[];
    final Object? meta = json['meta'];
    return Paginated<T>(
      data: items,
      meta: meta is Map<String, dynamic>
          ? PaginationMeta.fromJson(meta)
          : PaginationMeta(
              page: 1,
              limit: items.length,
              total: items.length,
              totalPages: items.isEmpty ? 0 : 1,
            ),
    );
  }

  const Paginated.empty()
      : data = const <Never>[],
        meta = const PaginationMeta(
          page: 1,
          limit: kListLimitDefault,
          total: 0,
          totalPages: 0,
        );

  final List<T> data;
  final PaginationMeta meta;

  bool get isEmpty => data.isEmpty;

  Paginated<T> appending(Paginated<T> next) => Paginated<T>(
        data: <T>[...data, ...next.data],
        meta: next.meta,
      );

  Paginated<R> map<R>(R Function(T) transform) => Paginated<R>(
        data: data.map(transform).toList(growable: false),
        meta: meta,
      );
}

/// Query parameters accepted by every list endpoint.
class ListQuery {
  const ListQuery({
    this.page = 1,
    this.limit = kListLimitDefault,
    this.sort,
    this.search,
    this.filters = const <String, String>{},
  });

  final int page;
  final int limit;

  /// Backend `buildOrderBy` syntax: `name` / `-createdAt` / `name,-createdAt`.
  final String? sort;
  final String? search;
  final Map<String, String> filters;

  ListQuery nextPage() => copyWith(page: page + 1);

  ListQuery copyWith({
    int? page,
    int? limit,
    String? sort,
    String? search,
    Map<String, String>? filters,
  }) =>
      ListQuery(
        page: page ?? this.page,
        limit: limit ?? this.limit,
        sort: sort ?? this.sort,
        search: search ?? this.search,
        filters: filters ?? this.filters,
      );

  Map<String, dynamic> toQueryParameters() => <String, dynamic>{
        'page': page,
        'limit': limit.clamp(1, kListLimitMax),
        if (sort != null && sort!.isNotEmpty) 'sort': sort,
        if (search != null && search!.trim().isNotEmpty) 'search': search!.trim(),
        ...filters,
      };

  /// Stable key used for the offline read-cache entry.
  String get cacheKey {
    final List<String> parts = <String>[
      'p$page',
      'l$limit',
      if (sort != null) 's$sort',
      if (search != null && search!.isNotEmpty) 'q$search',
      ...filters.entries.map((MapEntry<String, String> e) => '${e.key}=${e.value}'),
    ];
    return parts.join('&');
  }
}
