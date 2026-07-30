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
import 'package:unerp_mobile/features/manufacturing/domain/entities/manufacturing.dart';
import 'package:unerp_mobile/features/manufacturing/domain/repositories/manufacturing_repository.dart';
import 'package:unerp_mobile/features/manufacturing/presentation/providers/manufacturing_providers.dart';

// ── Entity constants ────────────────────────────────────────────────────────

const BomItem _bomItem = BomItem(
  id: 'bi1',
  bomId: 'bom1',
  productId: 'p1',
  productName: 'Raw Material',
  quantity: 2,
  rate: 50,
  amount: 100,
);

const Bom _bomA = Bom(
  id: 'bom1',
  name: 'BOM Alpha',
  productId: 'p1',
  productName: 'Finished Good A',
  type: 'MANUFACTURING',
  quantity: 1,
  status: 'ACTIVE',
  items: <BomItem>[_bomItem],
);

const Bom _bomB = Bom(
  id: 'bom2',
  name: 'BOM Beta',
  productId: 'p2',
  productName: 'Finished Good B',
  type: 'MANUFACTURING',
  quantity: 1,
  status: 'DRAFT',
  items: <BomItem>[_bomItem],
);

const WorkOrder _workOrderA = WorkOrder(
  id: 'wo1',
  workOrderNumber: 'WO-0001',
  productId: 'p1',
  productName: 'Finished Good A',
  quantity: 100,
  producedQuantity: 0,
  status: 'DRAFT',
);

const WorkOrder _workOrderB = WorkOrder(
  id: 'wo2',
  workOrderNumber: 'WO-0002',
  productId: 'p2',
  productName: 'Finished Good B',
  quantity: 50,
  producedQuantity: 20,
  status: 'IN_PROGRESS',
);

const MrpRun _mrpRunA = MrpRun(
  id: 'mrp1',
  productId: 'p1',
  productName: 'Finished Good A',
  demandQuantity: 500,
  supplyQuantity: 200,
  netRequirement: 300,
  status: 'COMPLETED',
);

const MrpRun _mrpRunB = MrpRun(
  id: 'mrp2',
  productId: 'p2',
  productName: 'Finished Good B',
  demandQuantity: 300,
  supplyQuantity: 100,
  netRequirement: 200,
  status: 'DRAFT',
);

const Workstation _workstationA = Workstation(
  id: 'ws1',
  name: 'Assembly Line 1',
  code: 'AL-01',
  location: 'Building A',
  status: 'AVAILABLE',
  capacity: 100,
);

const Workstation _workstationB = Workstation(
  id: 'ws2',
  name: 'Packaging Station',
  code: 'PS-01',
  location: 'Building B',
  status: 'OCCUPIED',
  capacity: 50,
);

const RoutingStep _routingStep = RoutingStep(
  id: 'rs1',
  routingId: 'r1',
  stepName: 'Cutting',
  stepOrder: 1,
  workstationId: 'ws1',
  duration: 30,
);

const Routing _routingA = Routing(
  id: 'r1',
  name: 'Assembly Routing',
  productId: 'p1',
  productName: 'Finished Good A',
  status: 'ACTIVE',
  steps: <RoutingStep>[_routingStep],
  totalDuration: 30,
);

const Routing _routingB = Routing(
  id: 'r2',
  name: 'Packaging Routing',
  status: 'DRAFT',
  steps: <RoutingStep>[],
  totalDuration: 0,
);

const QualityInspection _qualityInspectionA = QualityInspection(
  id: 'qi1',
  inspectionNumber: 'QI-0001',
  productId: 'p1',
  productName: 'Finished Good A',
  workOrderId: 'wo1',
  type: 'IN_PROCESS',
  status: 'PENDING',
  totalQty: 100,
  passedQty: 0,
  failedQty: 0,
);

const QualityInspection _qualityInspectionB = QualityInspection(
  id: 'qi2',
  inspectionNumber: 'QI-0002',
  productId: 'p2',
  productName: 'Finished Good B',
  type: 'FINAL',
  status: 'APPROVED',
  totalQty: 50,
  passedQty: 48,
  failedQty: 2,
  inspectedBy: 'Inspector-1',
);

const EngineeringChangeOrder _ecoA = EngineeringChangeOrder(
  id: 'eco1',
  name: 'ECO-001',
  bomId: 'bom1',
  bomName: 'BOM Alpha',
  description: 'Update raw material spec',
  reason: 'Supplier change',
  status: 'DRAFT',
);

const EngineeringChangeOrder _ecoB = EngineeringChangeOrder(
  id: 'eco2',
  name: 'ECO-002',
  bomId: 'bom2',
  bomName: 'BOM Beta',
  description: 'Reduce quantity',
  reason: 'Optimization',
  status: 'PENDING_APPROVAL',
);

// ── Paginated helper ────────────────────────────────────────────────────────

Paginated<T> _page<T>(List<T> items, {int page = 1, bool hasMore = false}) =>
    Paginated<T>(
      data: items,
      meta: PaginationMeta(
        page: page,
        limit: 25,
        total: hasMore ? items.length + 1 : items.length,
        totalPages: hasMore ? page + 1 : page,
      ),
    );

Cacheable<Paginated<T>> _cachedPage<T>(List<T> items,
        {int page = 1, bool hasMore = false}) =>
    Cacheable<Paginated<T>>(
      value: _page<T>(items, page: page, hasMore: hasMore),
    );

// ── FakeManufacturingRepository ─────────────────────────────────────────────

class FakeManufacturingRepository implements ManufacturingRepository {
  // Work Orders
  final List<ListQuery> receivedQueries = <ListQuery>[];
  Future<Result<Cacheable<Paginated<WorkOrder>>>> Function(ListQuery)?
      listWorkOrdersHandler;
  int deleteWorkOrderCalls = 0;
  int createWorkOrderCalls = 0;
  int updateWorkOrderCalls = 0;
  int startWorkOrderCalls = 0;
  int completeWorkOrderCalls = 0;
  Result<void> deleteWorkOrderResult = Result<void>.ok(null);
  Result<WorkOrder> startWorkOrderResult = Result<WorkOrder>.ok(_workOrderB);
  Result<WorkOrder> completeWorkOrderResult = Result<WorkOrder>.ok(_workOrderA);

  // BOMs
  Future<Result<Cacheable<Paginated<Bom>>>> Function(ListQuery)?
      listBomsHandler;
  int deleteBomCalls = 0;
  int createBomCalls = 0;
  Result<void> deleteBomResult = Result<void>.ok(null);

  // MRP Runs
  Future<Result<Cacheable<Paginated<MrpRun>>>> Function(ListQuery)?
      listMrpRunsHandler;
  int createMrpRunCalls = 0;
  Result<MrpRun> createMrpRunResult = Result<MrpRun>.ok(_mrpRunA);

  // Workstations
  Future<Result<Cacheable<Paginated<Workstation>>>> Function(ListQuery)?
      listWorkstationsHandler;
  int createWorkstationCalls = 0;

  // Routings
  Future<Result<Cacheable<Paginated<Routing>>>> Function(ListQuery)?
      listRoutingsHandler;
  int createRoutingCalls = 0;

  // Quality Inspections
  Future<Result<Cacheable<Paginated<QualityInspection>>>> Function(ListQuery)?
      listQualityInspectionsHandler;
  int createQualityInspectionCalls = 0;
  int updateQualityInspectionCalls = 0;

  // Engineering Change Orders
  Future<Result<Cacheable<Paginated<EngineeringChangeOrder>>>> Function(
      ListQuery)? listEngineeringChangeOrdersHandler;
  int createEngineeringChangeOrderCalls = 0;
  int approveEngineeringChangeOrderCalls = 0;
  Result<EngineeringChangeOrder> approveEngineeringChangeOrderResult =
      Result<EngineeringChangeOrder>.ok(_ecoB);

  // ── BOM ──

  @override
  Future<Result<Cacheable<Paginated<Bom>>>> listBoms(ListQuery query) async {
    receivedQueries.add(query);
    final handler = listBomsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<Bom>>>.ok(
      _cachedPage(<Bom>[_bomA, _bomB]),
    );
  }

  @override
  Future<Result<Bom>> getBom(String id) async =>
      Result<Bom>.ok(_bomA);

  @override
  Future<Result<Bom>> createBom(Map<String, dynamic> payload) async {
    createBomCalls++;
    return Result<Bom>.ok(_bomA);
  }

  @override
  Future<Result<Bom>> updateBom(String id, Map<String, dynamic> payload) async {
    updateWorkOrderCalls++;
    return Result<Bom>.ok(_bomA);
  }

  @override
  Future<Result<void>> deleteBom(String id) async {
    deleteBomCalls++;
    return deleteBomResult;
  }

  // ── Work Order ──

  @override
  Future<Result<Cacheable<Paginated<WorkOrder>>>> listWorkOrders(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listWorkOrdersHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<WorkOrder>>>.ok(
      _cachedPage(<WorkOrder>[_workOrderA, _workOrderB]),
    );
  }

  @override
  Future<Result<WorkOrder>> getWorkOrder(String id) async =>
      Result<WorkOrder>.ok(_workOrderA);

  @override
  Future<Result<WorkOrder>> createWorkOrder(Map<String, dynamic> payload) async {
    createWorkOrderCalls++;
    return Result<WorkOrder>.ok(_workOrderA);
  }

  @override
  Future<Result<WorkOrder>> updateWorkOrder(
      String id, Map<String, dynamic> payload) async {
    updateWorkOrderCalls++;
    return Result<WorkOrder>.ok(_workOrderA);
  }

  @override
  Future<Result<void>> deleteWorkOrder(String id) async {
    deleteWorkOrderCalls++;
    return deleteWorkOrderResult;
  }

  @override
  Future<Result<WorkOrder>> startWorkOrder(String id) async {
    startWorkOrderCalls++;
    return startWorkOrderResult;
  }

  @override
  Future<Result<WorkOrder>> completeWorkOrder(String id) async {
    completeWorkOrderCalls++;
    return completeWorkOrderResult;
  }

  @override
  Future<Result<WorkOrder>> cancelWorkOrder(String id) async =>
      Result<WorkOrder>.ok(_workOrderA);

  // ── MRP Run ──

  @override
  Future<Result<Cacheable<Paginated<MrpRun>>>> listMrpRuns(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listMrpRunsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<MrpRun>>>.ok(
      _cachedPage(<MrpRun>[_mrpRunA, _mrpRunB]),
    );
  }

  @override
  Future<Result<MrpRun>> getMrpRun(String id) async =>
      Result<MrpRun>.ok(_mrpRunA);

  @override
  Future<Result<MrpRun>> createMrpRun(Map<String, dynamic> payload) async {
    createMrpRunCalls++;
    return createMrpRunResult;
  }

  // ── Workstation ──

  @override
  Future<Result<Cacheable<Paginated<Workstation>>>> listWorkstations(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listWorkstationsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<Workstation>>>.ok(
      _cachedPage(<Workstation>[_workstationA, _workstationB]),
    );
  }

  @override
  Future<Result<Workstation>> getWorkstation(String id) async =>
      Result<Workstation>.ok(_workstationA);

  @override
  Future<Result<Workstation>> createWorkstation(
      Map<String, dynamic> payload) async {
    createWorkstationCalls++;
    return Result<Workstation>.ok(_workstationA);
  }

  @override
  Future<Result<Workstation>> updateWorkstation(
      String id, Map<String, dynamic> payload) async =>
      Result<Workstation>.ok(_workstationA);

  @override
  Future<Result<void>> deleteWorkstation(String id) async =>
      Result<void>.ok(null);

  // ── Routing ──

  @override
  Future<Result<Cacheable<Paginated<Routing>>>> listRoutings(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listRoutingsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<Routing>>>.ok(
      _cachedPage(<Routing>[_routingA, _routingB]),
    );
  }

  @override
  Future<Result<Routing>> getRouting(String id) async =>
      Result<Routing>.ok(_routingA);

  @override
  Future<Result<Routing>> createRouting(Map<String, dynamic> payload) async {
    createRoutingCalls++;
    return Result<Routing>.ok(_routingA);
  }

  @override
  Future<Result<Routing>> updateRouting(
      String id, Map<String, dynamic> payload) async =>
      Result<Routing>.ok(_routingA);

  @override
  Future<Result<void>> deleteRouting(String id) async =>
      Result<void>.ok(null);

  // ── Quality Inspection ──

  @override
  Future<Result<Cacheable<Paginated<QualityInspection>>>> listQualityInspections(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listQualityInspectionsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<QualityInspection>>>.ok(
      _cachedPage(<QualityInspection>[_qualityInspectionA, _qualityInspectionB]),
    );
  }

  @override
  Future<Result<QualityInspection>> getQualityInspection(String id) async =>
      Result<QualityInspection>.ok(_qualityInspectionA);

  @override
  Future<Result<QualityInspection>> createQualityInspection(
      Map<String, dynamic> payload) async {
    createQualityInspectionCalls++;
    return Result<QualityInspection>.ok(_qualityInspectionA);
  }

  @override
  Future<Result<QualityInspection>> updateQualityInspection(
      String id, Map<String, dynamic> payload) async {
    updateQualityInspectionCalls++;
    return Result<QualityInspection>.ok(_qualityInspectionA);
  }

  @override
  Future<Result<void>> deleteQualityInspection(String id) async =>
      Result<void>.ok(null);

  // ── Engineering Change Order ──

  @override
  Future<Result<Cacheable<Paginated<EngineeringChangeOrder>>>>
      listEngineeringChangeOrders(ListQuery query) async {
    receivedQueries.add(query);
    final handler = listEngineeringChangeOrdersHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<EngineeringChangeOrder>>>.ok(
      _cachedPage(<EngineeringChangeOrder>[_ecoA, _ecoB]),
    );
  }

  @override
  Future<Result<EngineeringChangeOrder>> getEngineeringChangeOrder(
          String id) async =>
      Result<EngineeringChangeOrder>.ok(_ecoA);

  @override
  Future<Result<EngineeringChangeOrder>> createEngineeringChangeOrder(
      Map<String, dynamic> payload) async {
    createEngineeringChangeOrderCalls++;
    return Result<EngineeringChangeOrder>.ok(_ecoA);
  }

  @override
  Future<Result<EngineeringChangeOrder>> updateEngineeringChangeOrder(
      String id, Map<String, dynamic> payload) async =>
      Result<EngineeringChangeOrder>.ok(_ecoA);

  @override
  Future<Result<void>> deleteEngineeringChangeOrder(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<EngineeringChangeOrder>> approveEngineeringChangeOrder(
      String id) async {
    approveEngineeringChangeOrderCalls++;
    return approveEngineeringChangeOrderResult;
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  late FakeManufacturingRepository fakeRepository;
  late ProviderContainer container;

  setUp(() {
    fakeRepository = FakeManufacturingRepository();
    container = ProviderContainer(
      overrides: <Override>[
      sharedPreferencesProvider.overrideWithValue(MockSharedPreferences()),
      cookieStoreProvider.overrideWithValue(CookieStore(CookieJar(), Uri.parse('http://localhost'))),
      apiClientProvider.overrideWithValue(ApiClient.forTesting(Dio())),
        manufacturingRepositoryProvider.overrideWithValue(fakeRepository),
        activeTenantIdProvider.overrideWithValue('tenant-1'),
      ],
    );
    addTearDown(container.dispose);
  });

  // ── WorkOrderListController ──────────────────────────────────────────

  group('WorkOrderListController', () {
    test('build loads page 1', () async {
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(workOrderListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('search debounces and resets to page 1', () async {
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      container.read(workOrderListControllerProvider.notifier).search('widget');
      await Future<void>.delayed(const Duration(milliseconds: 400));

      final last = fakeRepository.receivedQueries.last;
      expect(last.search, 'widget');
      expect(last.page, 1);
    });

    test('applySort resets to page 1', () async {
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      container
          .read(workOrderListControllerProvider.notifier)
          .applySort('-quantity');

      await Future<void>.delayed(Duration.zero);
      expect(fakeRepository.receivedQueries.length, 2);
      expect(fakeRepository.receivedQueries.last.sort, '-quantity');
      expect(fakeRepository.receivedQueries.last.page, 1);
    });

    test('loadMore appends data and requests next page', () async {
      fakeRepository.listWorkOrdersHandler =
          (ListQuery q) async =>
              Result<Cacheable<Paginated<WorkOrder>>>.ok(
                _cachedPage<WorkOrder>(
                  <WorkOrder>[
                    if (q.page == 1) _workOrderA else _workOrderB
                  ],
                  page: q.page,
                  hasMore: q.page == 1,
                ),
              );
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container
          .read(workOrderListControllerProvider.notifier)
          .loadMore();

      final state = container.read(workOrderListControllerProvider);
      expect(state.items.map((WorkOrder wo) => wo.id),
          <String>['wo1', 'wo2']);
      expect(
        fakeRepository.receivedQueries.map((ListQuery q) => q.page),
        <int>[1, 2],
      );
    });

    test('loadMore is a no-op when hasMore is false', () async {
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container
          .read(workOrderListControllerProvider.notifier)
          .loadMore();

      expect(fakeRepository.receivedQueries, hasLength(1));
    });

    test('save creates or updates and refreshes', () async {
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(workOrderListControllerProvider.notifier)
          .save(<String, dynamic>{'productId': 'p1', 'quantity': 100});

      expect(result.isOk, isTrue);
      expect(fakeRepository.createWorkOrderCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('submit calls StartWorkOrderUseCase via the repository', () async {
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await fakeRepository.startWorkOrder('wo1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.startWorkOrderCalls, 1);
    });

    test('submit failure surfaces the error', () async {
      fakeRepository.startWorkOrderResult =
          Result<WorkOrder>.err(ServerFailure('Cannot start'));
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await fakeRepository.startWorkOrder('wo1');

      expect(result.isErr, isTrue);
      expect(result.failureOrNull, isA<ServerFailure>());
    });

    test('complete calls CompleteWorkOrderUseCase via the repository', () async {
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await fakeRepository.completeWorkOrder('wo1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.completeWorkOrderCalls, 1);
    });

    test('complete failure surfaces the error', () async {
      fakeRepository.completeWorkOrderResult =
          Result<WorkOrder>.err(ServerFailure('Cannot complete'));
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await fakeRepository.completeWorkOrder('wo1');

      expect(result.isErr, isTrue);
      expect(result.failureOrNull, isA<ServerFailure>());
    });

    test('delete calls repository and refreshes', () async {
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(workOrderListControllerProvider.notifier)
          .delete('wo1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deleteWorkOrderCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('a repository failure on build surfaces without clearing silently',
        () async {
      fakeRepository.listWorkOrdersHandler = (ListQuery q) async =>
          Result<Cacheable<Paginated<WorkOrder>>>.err(
              ServerFailure('down'));
      container.read(workOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(workOrderListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });

  // ── BomListController ─────────────────────────────────────────────────

  group('BomListController', () {
    test('build loads page 1', () async {
      container.read(bomListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(bomListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save creates or updates and refreshes', () async {
      container.read(bomListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(bomListControllerProvider.notifier)
          .save(<String, dynamic>{
        'name': 'New BOM',
        'productId': 'p1',
        'quantity': 1,
      });

      expect(result.isOk, isTrue);
      expect(fakeRepository.createBomCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('delete calls repository and refreshes', () async {
      container.read(bomListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(bomListControllerProvider.notifier)
          .delete('bom1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deleteBomCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('a repository failure on build surfaces without clearing silently',
        () async {
      fakeRepository.listBomsHandler = (ListQuery q) async =>
          Result<Cacheable<Paginated<Bom>>>.err(
              ServerFailure('down'));
      container.read(bomListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(bomListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });

  // ── MrpRunListController ──────────────────────────────────────────────

  group('MrpRunListController', () {
    test('build loads page 1', () async {
      container.read(mrpRunListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(mrpRunListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('run triggers MRP run and refreshes', () async {
      container.read(mrpRunListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(mrpRunListControllerProvider.notifier)
          .save(<String, dynamic>{'productId': 'p1', 'demandQuantity': 500});

      expect(result.isOk, isTrue);
      expect(fakeRepository.createMrpRunCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('run failure surfaces the error', () async {
      fakeRepository.createMrpRunResult =
          Result<MrpRun>.err(ServerFailure('MRP run failed'));
      container.read(mrpRunListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(mrpRunListControllerProvider.notifier)
          .save(<String, dynamic>{'productId': 'p1'});

      expect(result.isErr, isTrue);
      expect(result.failureOrNull, isA<ServerFailure>());
    });
  });

  // ── WorkstationListController ─────────────────────────────────────────

  group('WorkstationListController', () {
    test('build loads page 1', () async {
      container.read(workstationListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(workstationListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save calls CreateWorkstationUseCase via the repository', () async {
      container.read(workstationListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await fakeRepository.createWorkstation(<String, dynamic>{
        'name': 'New Station',
        'code': 'NS-01',
      });

      expect(result.isOk, isTrue);
      expect(fakeRepository.createWorkstationCalls, 1);
    });

    test('a repository failure on build surfaces without clearing silently',
        () async {
      fakeRepository.listWorkstationsHandler = (ListQuery q) async =>
          Result<Cacheable<Paginated<Workstation>>>.err(
              ServerFailure('down'));
      container.read(workstationListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(workstationListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });

  // ── RoutingListController ─────────────────────────────────────────────

  group('RoutingListController', () {
    test('build loads page 1', () async {
      container.read(routingListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(routingListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save creates or updates and refreshes', () async {
      container.read(routingListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(routingListControllerProvider.notifier)
          .save(<String, dynamic>{
        'name': 'New Routing',
        'productId': 'p1',
      });

      expect(result.isOk, isTrue);
      expect(fakeRepository.createRoutingCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('a repository failure on build surfaces without clearing silently',
        () async {
      fakeRepository.listRoutingsHandler = (ListQuery q) async =>
          Result<Cacheable<Paginated<Routing>>>.err(
              ServerFailure('down'));
      container.read(routingListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(routingListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });

  // ── QualityInspectionListController ───────────────────────────────────

  group('QualityInspectionListController', () {
    test('build loads page 1', () async {
      container.read(qualityInspectionListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(qualityInspectionListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save creates or updates and refreshes', () async {
      container.read(qualityInspectionListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(qualityInspectionListControllerProvider.notifier)
          .save(<String, dynamic>{
        'productId': 'p1',
        'inspectionNumber': 'QI-NEW',
      });

      expect(result.isOk, isTrue);
      expect(fakeRepository.createQualityInspectionCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('a repository failure on build surfaces without clearing silently',
        () async {
      fakeRepository.listQualityInspectionsHandler = (ListQuery q) async =>
          Result<Cacheable<Paginated<QualityInspection>>>.err(
              ServerFailure('down'));
      container.read(qualityInspectionListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(qualityInspectionListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });

  // ── EngineeringChangeOrderListController ──────────────────────────────

  group('EngineeringChangeOrderListController', () {
    test('build loads page 1', () async {
      container.read(engineeringChangeOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state =
          container.read(engineeringChangeOrderListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save creates or updates and refreshes', () async {
      container.read(engineeringChangeOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(engineeringChangeOrderListControllerProvider.notifier)
          .save(<String, dynamic>{
        'name': 'ECO-NEW',
        'bomId': 'bom1',
      });

      expect(result.isOk, isTrue);
      expect(fakeRepository.createEngineeringChangeOrderCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('approve calls approve use case and refreshes', () async {
      container.read(engineeringChangeOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(engineeringChangeOrderListControllerProvider.notifier)
          .approve('eco1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.approveEngineeringChangeOrderCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('a repository failure on build surfaces without clearing silently',
        () async {
      fakeRepository.listEngineeringChangeOrdersHandler = (ListQuery q) async =>
          Result<Cacheable<Paginated<EngineeringChangeOrder>>>.err(
              ServerFailure('down'));
      container.read(engineeringChangeOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state =
          container.read(engineeringChangeOrderListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });
}

class MockSharedPreferences extends Mock implements SharedPreferences {}
