import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/manufacturing.dart';
import '../../domain/repositories/manufacturing_repository.dart';
import '../datasources/manufacturing_remote_data_source.dart';
import '../models/manufacturing_models.dart';

class ManufacturingRepositoryImpl implements ManufacturingRepository {
  const ManufacturingRepositoryImpl({
    required ManufacturingRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _bomNamespace = 'manufacturing.boms';
  static const String _woNamespace = 'manufacturing.work-orders';
  static const String _mrpNamespace = 'manufacturing.mrp';
  static const String _wsNamespace = 'manufacturing.workstations';
  static const String _rtNamespace = 'manufacturing.routings';
  static const String _qiNamespace = 'manufacturing.quality-inspections';
  static const String _ecoNamespace = 'manufacturing.eco';

  final ManufacturingRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final Paginated<T> page = await fetch();
      final List<Map<String, dynamic>> jsonItems = page.data
          .map((dynamic e) => (e as dynamic).toJson() as Map<String, dynamic>)
          .toList(growable: false);
      await _cache.write(_tenantId, namespace, query.cacheKey, <String, Object?>{
        'data': jsonItems,
        'meta': page.meta.toJson(),
      });
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: page),
      );
    } on NetworkException catch (error) {
      final cached = _cache.read<Map<String, dynamic>>(
        _tenantId, namespace, query.cacheKey,);
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(cached.value, fromJson),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _single<T>(Future<T> Function() fetch) async {
    try {
      return Result<T>.ok(await fetch());
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _delete(Future<void> Function() action) async {
    try {
      await action();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _write<T>(Future<T> Function() action) async {
    try {
      final T result = await action();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<Bom>>>> listBoms(ListQuery query) =>
      _paginated(_bomNamespace, query, () => _remote.listBoms(query),
        BomModel.fromJson,);

  @override
  Future<Result<Bom>> getBom(String id) => _single(() => _remote.getBom(id));

  @override
  Future<Result<Bom>> createBom(Map<String, dynamic> p) =>
      _write(() => _remote.createBom(p));

  @override
  Future<Result<Bom>> updateBom(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateBom(id, p));

  @override
  Future<Result<void>> deleteBom(String id) =>
      _delete(() => _remote.deleteBom(id));

  @override
  Future<Result<Cacheable<Paginated<WorkOrder>>>> listWorkOrders(ListQuery q) =>
      _paginated(_woNamespace, q, () => _remote.listWorkOrders(q),
        WorkOrderModel.fromJson,);

  @override
  Future<Result<WorkOrder>> getWorkOrder(String id) =>
      _single(() => _remote.getWorkOrder(id));

  @override
  Future<Result<WorkOrder>> createWorkOrder(Map<String, dynamic> p) =>
      _write(() => _remote.createWorkOrder(p));

  @override
  Future<Result<WorkOrder>> updateWorkOrder(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateWorkOrder(id, p));

  @override
  Future<Result<void>> deleteWorkOrder(String id) =>
      _delete(() => _remote.deleteWorkOrder(id));

  @override
  Future<Result<WorkOrder>> startWorkOrder(String id) =>
      _single(() => _remote.startWorkOrder(id));

  @override
  Future<Result<WorkOrder>> completeWorkOrder(String id) =>
      _single(() => _remote.completeWorkOrder(id));

  @override
  Future<Result<WorkOrder>> cancelWorkOrder(String id) =>
      _single(() => _remote.cancelWorkOrder(id));

  @override
  Future<Result<Cacheable<Paginated<MrpRun>>>> listMrpRuns(ListQuery q) =>
      _paginated(_mrpNamespace, q, () => _remote.listMrpRuns(q),
        MrpRunModel.fromJson,);

  @override
  Future<Result<MrpRun>> getMrpRun(String id) =>
      _single(() => _remote.getMrpRun(id));

  @override
  Future<Result<MrpRun>> createMrpRun(Map<String, dynamic> p) =>
      _write(() => _remote.createMrpRun(p));

  @override
  Future<Result<Cacheable<Paginated<Workstation>>>> listWorkstations(ListQuery q) =>
      _paginated(_wsNamespace, q, () => _remote.listWorkstations(q),
        WorkstationModel.fromJson,);

  @override
  Future<Result<Workstation>> getWorkstation(String id) =>
      _single(() => _remote.getWorkstation(id));

  @override
  Future<Result<Workstation>> createWorkstation(Map<String, dynamic> p) =>
      _write(() => _remote.createWorkstation(p));

  @override
  Future<Result<Workstation>> updateWorkstation(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateWorkstation(id, p));

  @override
  Future<Result<void>> deleteWorkstation(String id) =>
      _delete(() => _remote.deleteWorkstation(id));

  @override
  Future<Result<Cacheable<Paginated<Routing>>>> listRoutings(ListQuery q) =>
      _paginated(_rtNamespace, q, () => _remote.listRoutings(q),
        RoutingModel.fromJson,);

  @override
  Future<Result<Routing>> getRouting(String id) =>
      _single(() => _remote.getRouting(id));

  @override
  Future<Result<Routing>> createRouting(Map<String, dynamic> p) =>
      _write(() => _remote.createRouting(p));

  @override
  Future<Result<Routing>> updateRouting(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateRouting(id, p));

  @override
  Future<Result<void>> deleteRouting(String id) =>
      _delete(() => _remote.deleteRouting(id));

  @override
  Future<Result<Cacheable<Paginated<QualityInspection>>>> listQualityInspections(
    ListQuery q,) =>
      _paginated(_qiNamespace, q, () => _remote.listQualityInspections(q),
        QualityInspectionModel.fromJson,);

  @override
  Future<Result<QualityInspection>> getQualityInspection(String id) =>
      _single(() => _remote.getQualityInspection(id));

  @override
  Future<Result<QualityInspection>> createQualityInspection(Map<String, dynamic> p) =>
      _write(() => _remote.createQualityInspection(p));

  @override
  Future<Result<QualityInspection>> updateQualityInspection(
    String id, Map<String, dynamic> p,) =>
      _write(() => _remote.updateQualityInspection(id, p));

  @override
  Future<Result<void>> deleteQualityInspection(String id) =>
      _delete(() => _remote.deleteQualityInspection(id));

  @override
  Future<Result<Cacheable<Paginated<EngineeringChangeOrder>>>>
      listEngineeringChangeOrders(ListQuery q) =>
      _paginated(_ecoNamespace, q, () => _remote.listEngineeringChangeOrders(q),
        EngineeringChangeOrderModel.fromJson,);

  @override
  Future<Result<EngineeringChangeOrder>> getEngineeringChangeOrder(String id) =>
      _single(() => _remote.getEngineeringChangeOrder(id));

  @override
  Future<Result<EngineeringChangeOrder>> createEngineeringChangeOrder(
    Map<String, dynamic> p,) =>
      _write(() => _remote.createEngineeringChangeOrder(p));

  @override
  Future<Result<EngineeringChangeOrder>> updateEngineeringChangeOrder(
    String id, Map<String, dynamic> p,) =>
      _write(() => _remote.updateEngineeringChangeOrder(id, p));

  @override
  Future<Result<void>> deleteEngineeringChangeOrder(String id) =>
      _delete(() => _remote.deleteEngineeringChangeOrder(id));

  @override
  Future<Result<EngineeringChangeOrder>> approveEngineeringChangeOrder(
    String id,) => _single(() => _remote.approveEngineeringChangeOrder(id));
}