import 'dart:async';

import 'package:flutter/material.dart';

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

import 'package:unerp_mobile/features/manufacturing/presentation/pages/bom_detail_page.dart';

import 'package:unerp_mobile/features/manufacturing/presentation/pages/work_order_detail_page.dart';

import 'package:unerp_mobile/features/manufacturing/presentation/providers/manufacturing_providers.dart';



// ── Entity constants ────────────────────────────────────────────────────────



const BomItem _bomItem = BomItem(

  id: 'bi1',

  bomId: 'bom1',

  productId: 'p1',

  productName: 'Raw Material X',

  quantity: 2,

  rate: 50,

  amount: 100,

);



const Bom _bom = Bom(

  id: 'bom1',

  name: 'BOM Alpha',

  productId: 'p1',

  productName: 'Finished Good A',

  type: 'MANUFACTURING',

  quantity: 1,

  status: 'ACTIVE',

  items: <BomItem>[_bomItem],

  wastagePercentage: 5.0,

  createdAt: null,

);



const WorkOrder _workOrderDraft = WorkOrder(

  id: 'wo1',

  workOrderNumber: 'WO-0001',

  productId: 'p1',

  productName: 'Finished Good A',

  quantity: 100,

  producedQuantity: 0,

  status: 'DRAFT',

  scheduledStart: null,

  scheduledEnd: null,

  actualStart: null,

  actualEnd: null,

);



const WorkOrder _workOrderInProgress = WorkOrder(

  id: 'wo2',

  workOrderNumber: 'WO-0002',

  productId: 'p2',

  productName: 'Finished Good B',

  quantity: 50,

  producedQuantity: 20,

  status: 'IN_PROGRESS',

  scheduledStart: null,

  scheduledEnd: null,

  actualStart: null,

  actualEnd: null,

);



const WorkOrder _workOrderCompleted = WorkOrder(

  id: 'wo3',

  workOrderNumber: 'WO-0003',

  productId: 'p1',

  productName: 'Finished Good A',

  quantity: 100,

  producedQuantity: 100,

  status: 'COMPLETED',

  scheduledStart: null,

  scheduledEnd: null,

  actualStart: null,

  actualEnd: null,

);



// ── Fake repository for detail pages ────────────────────────────────────────



class FakeDetailRepository implements ManufacturingRepository {

  Future<Result<WorkOrder>> Function(String) getWorkOrderFn =

      (String id) async => Result<WorkOrder>.ok(_workOrderDraft);

  Future<Result<Bom>> Function(String) getBomFn =

      (String id) async => Result<Bom>.ok(_bom);



  @override

  Future<Result<Cacheable<Paginated<WorkOrder>>>> listWorkOrders(

          ListQuery query) async =>

      Result<Cacheable<Paginated<WorkOrder>>>.ok(

        Cacheable<Paginated<WorkOrder>>(

          value: Paginated<WorkOrder>(data: [], meta: PaginationMeta(

            page: 1, limit: 25, total: 0, totalPages: 0,

          )),

        ),

      );



  @override

  Future<Result<WorkOrder>> getWorkOrder(String id) => getWorkOrderFn(id);



  @override

  Future<Result<WorkOrder>> createWorkOrder(

          Map<String, dynamic> payload) async =>

      Result<WorkOrder>.ok(_workOrderDraft);



  @override

  Future<Result<WorkOrder>> updateWorkOrder(

          String id, Map<String, dynamic> payload) async =>

      Result<WorkOrder>.ok(_workOrderDraft);



  @override

  Future<Result<void>> deleteWorkOrder(String id) async =>

      Result<void>.ok(null);



  @override

  Future<Result<WorkOrder>> startWorkOrder(String id) async =>

      Result<WorkOrder>.ok(_workOrderInProgress);



  @override

  Future<Result<WorkOrder>> completeWorkOrder(String id) async =>

      Result<WorkOrder>.ok(_workOrderCompleted);



  @override

  Future<Result<WorkOrder>> cancelWorkOrder(String id) async =>

      Result<WorkOrder>.ok(_workOrderDraft);



  @override

  Future<Result<Cacheable<Paginated<Bom>>>> listBoms(

          ListQuery query) async =>

      Result<Cacheable<Paginated<Bom>>>.ok(

        Cacheable<Paginated<Bom>>(

          value: Paginated<Bom>(data: [], meta: PaginationMeta(

            page: 1, limit: 25, total: 0, totalPages: 0,

          )),

        ),

      );



  @override

  Future<Result<Bom>> getBom(String id) => getBomFn(id);



  @override

  Future<Result<Bom>> createBom(Map<String, dynamic> payload) async =>

      Result<Bom>.ok(_bom);



  @override

  Future<Result<Bom>> updateBom(

          String id, Map<String, dynamic> payload) async =>

      Result<Bom>.ok(_bom);



  @override

  Future<Result<void>> deleteBom(String id) async =>

      Result<void>.ok(null);



  @override

  Future<Result<Cacheable<Paginated<MrpRun>>>> listMrpRuns(

          ListQuery query) async =>

      Result<Cacheable<Paginated<MrpRun>>>.ok(

        Cacheable<Paginated<MrpRun>>(

          value: Paginated<MrpRun>(data: [], meta: PaginationMeta(

            page: 1, limit: 25, total: 0, totalPages: 0,

          )),

        ),

      );



  @override

  Future<Result<MrpRun>> getMrpRun(String id) async =>

      Result<MrpRun>.ok(MrpRun(

        id: 'mrp1', productId: 'p1', productName: 'P1',

        demandQuantity: 100, supplyQuantity: 50, netRequirement: 50,

      ));



  @override

  Future<Result<MrpRun>> createMrpRun(Map<String, dynamic> payload) async =>

      Result<MrpRun>.ok(MrpRun(

        id: 'mrp1', productId: 'p1', productName: 'P1',

        demandQuantity: 100, supplyQuantity: 50, netRequirement: 50,

      ));



  @override

  Future<Result<Cacheable<Paginated<Workstation>>>> listWorkstations(

          ListQuery query) async =>

      Result<Cacheable<Paginated<Workstation>>>.ok(

        Cacheable<Paginated<Workstation>>(

          value: Paginated<Workstation>(data: [], meta: PaginationMeta(

            page: 1, limit: 25, total: 0, totalPages: 0,

          )),

        ),

      );



  @override

  Future<Result<Workstation>> getWorkstation(String id) async =>

      Result<Workstation>.ok(Workstation(

        id: 'ws1', name: 'Station 1',

      ));



  @override

  Future<Result<Workstation>> createWorkstation(

          Map<String, dynamic> payload) async =>

      Result<Workstation>.ok(Workstation(id: 'ws1', name: 'Station 1'));



  @override

  Future<Result<Workstation>> updateWorkstation(

          String id, Map<String, dynamic> payload) async =>

      Result<Workstation>.ok(Workstation(id: 'ws1', name: 'Station 1'));



  @override

  Future<Result<void>> deleteWorkstation(String id) async =>

      Result<void>.ok(null);



  @override

  Future<Result<Cacheable<Paginated<Routing>>>> listRoutings(

          ListQuery query) async =>

      Result<Cacheable<Paginated<Routing>>>.ok(

        Cacheable<Paginated<Routing>>(

          value: Paginated<Routing>(data: [], meta: PaginationMeta(

            page: 1, limit: 25, total: 0, totalPages: 0,

          )),

        ),

      );



  @override

  Future<Result<Routing>> getRouting(String id) async =>

      Result<Routing>.ok(Routing(id: 'r1', name: 'Routing 1'));



  @override

  Future<Result<Routing>> createRouting(Map<String, dynamic> payload) async =>

      Result<Routing>.ok(Routing(id: 'r1', name: 'Routing 1'));



  @override

  Future<Result<Routing>> updateRouting(

          String id, Map<String, dynamic> payload) async =>

      Result<Routing>.ok(Routing(id: 'r1', name: 'Routing 1'));



  @override

  Future<Result<void>> deleteRouting(String id) async =>

      Result<void>.ok(null);



  @override

  Future<Result<Cacheable<Paginated<QualityInspection>>>>

      listQualityInspections(ListQuery query) async =>

      Result<Cacheable<Paginated<QualityInspection>>>.ok(

        Cacheable<Paginated<QualityInspection>>(

          value: Paginated<QualityInspection>(data: [], meta: PaginationMeta(

            page: 1, limit: 25, total: 0, totalPages: 0,

          )),

        ),

      );



  @override

  Future<Result<QualityInspection>> getQualityInspection(String id) async =>

      Result<QualityInspection>.ok(QualityInspection(

        id: 'qi1', inspectionNumber: 'QI-001', productId: 'p1',

        productName: 'P1',

      ));



  @override

  Future<Result<QualityInspection>> createQualityInspection(

          Map<String, dynamic> payload) async =>

      Result<QualityInspection>.ok(QualityInspection(

        id: 'qi1', inspectionNumber: 'QI-001', productId: 'p1',

        productName: 'P1',

      ));



  @override

  Future<Result<QualityInspection>> updateQualityInspection(

          String id, Map<String, dynamic> payload) async =>

      Result<QualityInspection>.ok(QualityInspection(

        id: 'qi1', inspectionNumber: 'QI-001', productId: 'p1',

        productName: 'P1',

      ));



  @override

  Future<Result<void>> deleteQualityInspection(String id) async =>

      Result<void>.ok(null);



  @override

  Future<Result<Cacheable<Paginated<EngineeringChangeOrder>>>>

      listEngineeringChangeOrders(ListQuery query) async =>

      Result<Cacheable<Paginated<EngineeringChangeOrder>>>.ok(

        Cacheable<Paginated<EngineeringChangeOrder>>(

          value: Paginated<EngineeringChangeOrder>(data: [], meta: PaginationMeta(

            page: 1, limit: 25, total: 0, totalPages: 0,

          )),

        ),

      );



  @override

  Future<Result<EngineeringChangeOrder>> getEngineeringChangeOrder(

          String id) async =>

      Result<EngineeringChangeOrder>.ok(EngineeringChangeOrder(

        id: 'eco1', name: 'ECO-001',

      ));



  @override

  Future<Result<EngineeringChangeOrder>> createEngineeringChangeOrder(

          Map<String, dynamic> payload) async =>

      Result<EngineeringChangeOrder>.ok(EngineeringChangeOrder(

        id: 'eco1', name: 'ECO-001',

      ));



  @override

  Future<Result<EngineeringChangeOrder>> updateEngineeringChangeOrder(

          String id, Map<String, dynamic> payload) async =>

      Result<EngineeringChangeOrder>.ok(EngineeringChangeOrder(

        id: 'eco1', name: 'ECO-001',

      ));



  @override

  Future<Result<void>> deleteEngineeringChangeOrder(String id) async =>

      Result<void>.ok(null);



  @override

  Future<Result<EngineeringChangeOrder>> approveEngineeringChangeOrder(

          String id) async =>

      Result<EngineeringChangeOrder>.ok(EngineeringChangeOrder(

        id: 'eco1', name: 'ECO-001',

      ));

}



Widget _buildApp(FakeDetailRepository repo, Widget child) => ProviderScope(

      overrides: <Override>[

      sharedPreferencesProvider.overrideWithValue(MockSharedPreferences()),

      cookieStoreProvider.overrideWithValue(CookieStore(CookieJar(), Uri.parse('http://localhost'))),

      apiClientProvider.overrideWithValue(ApiClient.forTesting(Dio())),

        manufacturingRepositoryProvider.overrideWithValue(repo),

        activeTenantIdProvider.overrideWithValue('tenant-1'),

      ],

      child: MaterialApp(home: child),

    );



// ── Tests ───────────────────────────────────────────────────────────────────



void main() {

  group('WorkOrderDetailPage', () {

    testWidgets('renders work order number and product name for draft status',

        (tester) async {

      final repo = FakeDetailRepository();

      repo.getWorkOrderFn = (String id) async =>

          Result<WorkOrder>.ok(_workOrderDraft);



      await tester.pumpWidget(

        _buildApp(repo, const WorkOrderDetailPage(id: 'wo1')),

      );

      await tester.pumpAndSettle();



      expect(find.text('WO-0001'), findsOneWidget);

      expect(find.text('Finished Good A'), findsOneWidget);

      expect(find.text('DRAFT'), findsOneWidget);

      expect(find.text('Planned Qty'), findsOneWidget);

      expect(find.text('100'), findsAtLeast(1));

    });



    testWidgets('shows produced quantity when greater than zero',

        (tester) async {

      final repo = FakeDetailRepository();

      repo.getWorkOrderFn = (String id) async =>

          Result<WorkOrder>.ok(_workOrderInProgress);



      await tester.pumpWidget(

        _buildApp(repo, const WorkOrderDetailPage(id: 'wo2')),

      );

      await tester.pumpAndSettle();



      expect(find.text('WO-0002'), findsOneWidget);

      expect(find.text('IN_PROGRESS'), findsOneWidget);

      expect(find.text('20'), findsAtLeast(1));

    });



    testWidgets('renders completed status for a finished work order',

        (tester) async {

      final repo = FakeDetailRepository();

      repo.getWorkOrderFn = (String id) async =>

          Result<WorkOrder>.ok(_workOrderCompleted);



      await tester.pumpWidget(

        _buildApp(repo, const WorkOrderDetailPage(id: 'wo3')),

      );

      await tester.pumpAndSettle();



      expect(find.text('WO-0003'), findsOneWidget);

      expect(find.text('COMPLETED'), findsOneWidget);

      expect(find.text('100'), findsAtLeast(1));

    });



    testWidgets('shows schedule section headers', (tester) async {

      final repo = FakeDetailRepository();

      repo.getWorkOrderFn = (String id) async =>

          Result<WorkOrder>.ok(_workOrderDraft);



      await tester.pumpWidget(

        _buildApp(repo, const WorkOrderDetailPage(id: 'wo1')),

      );

      await tester.pumpAndSettle();



      expect(find.text('Production'), findsOneWidget);

      expect(find.text('Schedule'), findsOneWidget);

    });



    testWidgets('shows BOM, Workstation, and Routing labels when ids present',

        (tester) async {

      final repo = FakeDetailRepository();

      repo.getWorkOrderFn = (String id) async =>

          Result<WorkOrder>.ok(WorkOrder(

        id: 'wo4',

        workOrderNumber: 'WO-0004',

        productId: 'p1',

        productName: 'Complex Product',

        quantity: 10,

        producedQuantity: 0,

        status: 'PLANNED',

        bomId: 'bom1',

        workstationId: 'ws1',

        routingId: 'r1',

      ));



      await tester.pumpWidget(

        _buildApp(repo, const WorkOrderDetailPage(id: 'wo4')),

      );

      await tester.pumpAndSettle();



      expect(find.text('BOM'), findsOneWidget);

      expect(find.text('bom1'), findsOneWidget);

      expect(find.text('Workstation'), findsOneWidget);

      expect(find.text('ws1'), findsOneWidget);

      expect(find.text('Routing'), findsOneWidget);

      expect(find.text('r1'), findsOneWidget);

    });



    testWidgets('shows loading state while fetching', (tester) async {

      final repo = FakeDetailRepository();

      // Hold the future so the page stays in loading state

      late Completer<WorkOrder> completer;

      completer = Completer<WorkOrder>();

      repo.getWorkOrderFn = (String id) async =>

          Result<WorkOrder>.ok(await completer.future);



      await tester.pumpWidget(

        _buildApp(repo, const WorkOrderDetailPage(id: 'wo1')),

      );

      await tester.pump();



      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      completer.complete(_workOrderDraft);

      await tester.pumpAndSettle();



      expect(find.text('WO-0001'), findsOneWidget);

    });

  });



  group('BomDetailPage', () {

    testWidgets('renders BOM name, product name, and status', (tester) async {

      final repo = FakeDetailRepository();



      await tester.pumpWidget(

        _buildApp(repo, const BomDetailPage(id: 'bom1')),

      );

      await tester.pumpAndSettle();



      expect(find.text('BOM Alpha'), findsOneWidget);

      expect(find.text('Finished Good A'), findsOneWidget);

      expect(find.text('ACTIVE'), findsOneWidget);

    });



    testWidgets('renders type and quantity fields', (tester) async {

      final repo = FakeDetailRepository();



      await tester.pumpWidget(

        _buildApp(repo, const BomDetailPage(id: 'bom1')),

      );

      await tester.pumpAndSettle();



      expect(find.text('Details'), findsOneWidget);

      expect(find.text('Type'), findsOneWidget);

      expect(find.text('MANUFACTURING'), findsOneWidget);

      expect(find.text('Quantity'), findsOneWidget);

      expect(find.text('1.00'), findsOneWidget);

    });



    testWidgets('renders wastage percentage when present', (tester) async {

      final repo = FakeDetailRepository();



      await tester.pumpWidget(

        _buildApp(repo, const BomDetailPage(id: 'bom1')),

      );

      await tester.pumpAndSettle();



      expect(find.text('Wastage %'), findsOneWidget);

      expect(find.text('5.0%'), findsOneWidget);

    });



    testWidgets('renders items section with product names and quantities',

        (tester) async {

      final repo = FakeDetailRepository();



      await tester.pumpWidget(

        _buildApp(repo, const BomDetailPage(id: 'bom1')),

      );

      await tester.pumpAndSettle();



      expect(find.text('Items (1)'), findsOneWidget);

      expect(find.text('Raw Material X'), findsOneWidget);

      expect(find.text('2.00'), findsOneWidget);

    });



    testWidgets('renders item rate when present', (tester) async {

      final repo = FakeDetailRepository();



      await tester.pumpWidget(

        _buildApp(repo, const BomDetailPage(id: 'bom1')),

      );

      await tester.pumpAndSettle();



      expect(find.text('\$50.00'), findsOneWidget);

    });



    testWidgets('shows loading state while fetching BOM', (tester) async {

      final repo = FakeDetailRepository();

      late Completer<Bom> completer;

      completer = Completer<Bom>();

      repo.getBomFn = (String id) async =>

          Result<Bom>.ok(await completer.future);



      await tester.pumpWidget(

        _buildApp(repo, const BomDetailPage(id: 'bom1')),

      );

      await tester.pump();



      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      completer.complete(_bom);

      await tester.pumpAndSettle();



      expect(find.text('BOM Alpha'), findsOneWidget);

    });



    testWidgets('renders draft status tone', (tester) async {

      final repo = FakeDetailRepository();

      repo.getBomFn = (String id) async => Result<Bom>.ok(Bom(

        id: 'bom2',

        name: 'BOM Beta',

        productId: 'p2',

        productName: 'Product Beta',

        type: 'MANUFACTURING',

        quantity: 1,

        status: 'DRAFT',

        items: <BomItem>[],

      ));



      await tester.pumpWidget(

        _buildApp(repo, const BomDetailPage(id: 'bom2')),

      );

      await tester.pumpAndSettle();



      expect(find.text('DRAFT'), findsOneWidget);

    });



    testWidgets('hides items section when there are no items', (tester) async {

      final repo = FakeDetailRepository();

      repo.getBomFn = (String id) async => Result<Bom>.ok(Bom(

        id: 'bom3',

        name: 'BOM Gamma',

        productId: 'p3',

        productName: 'Product Gamma',

        type: 'PURCHASED',

        quantity: 1,

        status: 'ACTIVE',

        items: <BomItem>[],

      ));



      await tester.pumpWidget(

        _buildApp(repo, const BomDetailPage(id: 'bom3')),

      );

      await tester.pumpAndSettle();



      expect(find.text('BOM Gamma'), findsOneWidget);

      expect(find.textContaining('Items'), findsNothing);

    });

  });

}



class MockSharedPreferences extends Mock implements SharedPreferences {}

