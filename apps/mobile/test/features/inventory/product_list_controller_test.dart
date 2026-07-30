import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:unerp_mobile/core/di/providers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mocktail/mocktail.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:unerp_mobile/core/storage/cookie_store.dart';
import 'package:unerp_mobile/core/network/api_client.dart';
import 'package:dio/dio.dart';

import 'package:unerp_mobile/core/contracts/paginated.dart';
import 'package:unerp_mobile/core/error/failures.dart';
import 'package:unerp_mobile/core/usecase/result.dart';
import 'package:unerp_mobile/features/auth/presentation/providers/auth_providers.dart';
import 'package:unerp_mobile/features/inventory/domain/entities/product.dart';
import 'package:unerp_mobile/features/inventory/domain/repositories/inventory_repository.dart';
import 'package:unerp_mobile/features/inventory/presentation/providers/inventory_providers.dart';

const Product _productA = Product(
  id: 'p1',
  sku: 'A',
  name: 'Alpha',
  type: 'GOODS',
  unit: 'EACH',
  costPrice: 5,
  sellPrice: 10,
  isActive: true,
);
const Product _productB = Product(
  id: 'p2',
  sku: 'B',
  name: 'Beta',
  type: 'GOODS',
  unit: 'EACH',
  costPrice: 5,
  sellPrice: 10,
  isActive: true,
);

Paginated<Product> _page(List<Product> items, {int page = 1, bool hasMore = false}) =>
    Paginated<Product>(
      data: items,
      meta: PaginationMeta(
        page: page,
        limit: 25,
        total: hasMore ? items.length + 1 : items.length,
        totalPages: hasMore ? page + 1 : page,
      ),
    );

/// Records every query it receives so tests can assert server-side paging,
/// search, and sort were requested rather than done client-side (AGENTS.md
/// Rule 25).
class FakeInventoryRepository extends Mock implements InventoryRepository {
  final List<ListQuery> receivedQueries = <ListQuery>[];
  Future<Result<Cacheable<Paginated<Product>>>> Function(ListQuery)? listHandler;
  int deleteCalls = 0;
  Result<void> deleteResult = Result<void>.ok(null);

  @override
  Future<Result<Cacheable<Paginated<Product>>>> listProducts(ListQuery query) async {
    receivedQueries.add(query);
    final Future<Result<Cacheable<Paginated<Product>>>> Function(ListQuery)? handler =
        listHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<Product>>>.ok(
      Cacheable<Paginated<Product>>(value: _page(<Product>[_productA, _productB])),
    );
  }

  @override
  Future<Result<Product>> getProduct(String id) async => Result<Product>.ok(_productA);

  @override
  Future<Result<InventoryStats>> stats() async =>
      Result<InventoryStats>.ok(InventoryStats.zero());

  @override
  Future<Result<Product>> createProduct(Map<String, dynamic> payload) async =>
      Result<Product>.ok(_productA);

  @override
  Future<Result<Product>> updateProduct(String id, Map<String, dynamic> payload) async =>
      Result<Product>.ok(_productA);

  @override
  Future<Result<void>> deleteProduct(String id) async {
    deleteCalls++;
    return deleteResult;
  }

  @override
  Future<Result<void>> adjustStock(Map<String, dynamic> payload) async =>
      Result<void>.ok(null);
}

void main() {
  late FakeInventoryRepository fakeRepository;
  late ProviderContainer container;

  setUp(() {
    fakeRepository = FakeInventoryRepository();
    container = ProviderContainer(
      overrides: <Override>[
      sharedPreferencesProvider.overrideWithValue(MockSharedPreferences()),
      cookieStoreProvider.overrideWithValue(CookieStore(CookieJar(), Uri.parse('http://localhost'))),
      apiClientProvider.overrideWithValue(ApiClient.forTesting(Dio())),
        inventoryRepositoryProvider.overrideWithValue(fakeRepository),
        activeTenantIdProvider.overrideWithValue('tenant-1'),
      ],
    );
    addTearDown(container.dispose);
  });

  test('loads page 1 on build without any client-side slicing', () async {
    container.read(productListControllerProvider);
    await Future<void>.delayed(Duration.zero);

    final ProductListState state = container.read(productListControllerProvider);
    expect(state.items, hasLength(2));
    expect(state.isLoading, isFalse);
    expect(fakeRepository.receivedQueries.single.page, 1);
  });

  test('a repository failure on first load surfaces without clearing to empty silently', () async {
    fakeRepository.listHandler = (ListQuery q) async =>
        Result<Cacheable<Paginated<Product>>>.err(ServerFailure('down'));
    container.read(productListControllerProvider);
    await Future<void>.delayed(Duration.zero);

    final ProductListState state = container.read(productListControllerProvider);
    expect(state.failure, isA<ServerFailure>());
    expect(state.items, isEmpty);
  });

  test('loadMore requests the next server page and appends results', () async {
    fakeRepository.listHandler = (ListQuery q) async => Result<Cacheable<Paginated<Product>>>.ok(
          Cacheable<Paginated<Product>>(
            value: _page(
              <Product>[if (q.page == 1) _productA else _productB],
              page: q.page,
              hasMore: q.page == 1,
            ),
          ),
        );
    container.read(productListControllerProvider);
    await Future<void>.delayed(Duration.zero);

    await container.read(productListControllerProvider.notifier).loadMore();

    final ProductListState state = container.read(productListControllerProvider);
    expect(state.items.map((Product p) => p.id), <String>['p1', 'p2']);
    expect(fakeRepository.receivedQueries.map((ListQuery q) => q.page), <int>[1, 2]);
  });

  test('loadMore is a no-op once every page has been fetched', () async {
    container.read(productListControllerProvider);
    await Future<void>.delayed(Duration.zero);
    // Default handler returns hasMore: false (totalPages == page).

    await container.read(productListControllerProvider.notifier).loadMore();

    expect(fakeRepository.receivedQueries, hasLength(1)); // only the initial load
  });

  test('search resets to page 1 and forwards the term to the server', () async {
    container.read(productListControllerProvider);
    await Future<void>.delayed(Duration.zero);

    container.read(productListControllerProvider.notifier).search('widget');
    await Future<void>.delayed(const Duration(milliseconds: 400)); // debounce

    final ListQuery last = fakeRepository.receivedQueries.last;
    expect(last.search, 'widget');
    expect(last.page, 1);
  });

  test('delete calls the repository and refreshes the list', () async {
    container.read(productListControllerProvider);
    await Future<void>.delayed(Duration.zero);

    final Result<void> result =
        await container.read(productListControllerProvider.notifier).delete('p1');

    expect(result.isOk, isTrue);
    expect(fakeRepository.deleteCalls, 1);
    // refresh() re-issues the initial query — two calls total.
    expect(fakeRepository.receivedQueries, hasLength(2));
  });
}

class MockSharedPreferences extends Mock implements SharedPreferences {}
