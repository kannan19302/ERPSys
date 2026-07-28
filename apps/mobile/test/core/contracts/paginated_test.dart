import 'package:flutter_test/flutter_test.dart';
import 'package:unerp_mobile/core/contracts/paginated.dart';

Map<String, dynamic> _item(String id) => <String, dynamic>{'id': id};

void main() {
  group('PaginationMeta', () {
    test('parses a well-formed meta object', () {
      final PaginationMeta meta = PaginationMeta.fromJson(<String, dynamic>{
        'page': 2,
        'limit': 25,
        'total': 120,
        'totalPages': 5,
      });
      expect(meta.page, 2);
      expect(meta.hasMore, isTrue);
    });

    test('hasMore is false on the last page', () {
      const PaginationMeta meta = PaginationMeta(page: 5, limit: 25, total: 120, totalPages: 5);
      expect(meta.hasMore, isFalse);
    });

    test('tolerates numeric-looking strings from a loose backend', () {
      final PaginationMeta meta = PaginationMeta.fromJson(<String, dynamic>{
        'page': '3',
        'limit': '25',
        'total': '10',
        'totalPages': '1',
      });
      expect(meta.page, 3);
      expect(meta.total, 10);
    });
  });

  group('Paginated.fromJson', () {
    test('parses the frozen { data, meta } contract', () {
      final Paginated<Map<String, dynamic>> page = Paginated<Map<String, dynamic>>.fromJson(
        <String, dynamic>{
          'data': <Map<String, dynamic>>[_item('a'), _item('b')],
          'meta': <String, dynamic>{'page': 1, 'limit': 25, 'total': 2, 'totalPages': 1},
        },
        (Map<String, dynamic> j) => j,
      );
      expect(page.data, hasLength(2));
      expect(page.meta.total, 2);
      expect(page.isEmpty, isFalse);
    });

    test('synthesises single-page meta for a bare-array legacy endpoint', () {
      // Some legacy controllers (e.g. communication.controller.ts's
      // /notifications) return a plain array instead of the pagination
      // envelope — ApiClient.getList() handles that separately, but
      // Paginated.fromJson must not explode if it's ever handed one.
      final Paginated<Map<String, dynamic>> page = Paginated<Map<String, dynamic>>.fromJson(
        <String, dynamic>{},
        (Map<String, dynamic> j) => j,
      );
      expect(page.data, isEmpty);
      expect(page.meta.total, 0);
    });

    test('appending concatenates data and adopts the newer meta', () {
      const Paginated<int> first = Paginated<int>(
        data: <int>[1, 2],
        meta: PaginationMeta(page: 1, limit: 2, total: 4, totalPages: 2),
      );
      const Paginated<int> second = Paginated<int>(
        data: <int>[3, 4],
        meta: PaginationMeta(page: 2, limit: 2, total: 4, totalPages: 2),
      );
      final Paginated<int> combined = first.appending(second);
      expect(combined.data, <int>[1, 2, 3, 4]);
      expect(combined.meta.page, 2);
    });
  });

  group('ListQuery', () {
    test('toQueryParameters includes only set fields', () {
      const ListQuery query = ListQuery(page: 2, limit: 50, sort: '-createdAt');
      final Map<String, dynamic> params = query.toQueryParameters();
      expect(params['page'], 2);
      expect(params['limit'], 50);
      expect(params['sort'], '-createdAt');
      expect(params.containsKey('search'), isFalse);
    });

    test('limit is clamped to the max the API accepts', () {
      const ListQuery query = ListQuery(limit: 500);
      expect(query.toQueryParameters()['limit'], kListLimitMax);
    });

    test('blank search terms are omitted, not sent as whitespace', () {
      const ListQuery query = ListQuery(search: '   ');
      expect(query.toQueryParameters().containsKey('search'), isFalse);
    });

    test('nextPage increments only the page', () {
      const ListQuery query = ListQuery(page: 3, search: 'widget');
      final ListQuery next = query.nextPage();
      expect(next.page, 4);
      expect(next.search, 'widget');
    });

    test('cacheKey is stable for identical queries and differs otherwise', () {
      const ListQuery a = ListQuery(page: 1, search: 'foo');
      const ListQuery b = ListQuery(page: 1, search: 'foo');
      const ListQuery c = ListQuery(page: 2, search: 'foo');
      expect(a.cacheKey, b.cacheKey);
      expect(a.cacheKey, isNot(c.cacheKey));
    });
  });
}
