import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/analytics.dart';
import '../../domain/repositories/analytics_repository.dart';
import '../datasources/analytics_remote_data_source.dart';
import '../models/analytics_models.dart';

class AnalyticsRepositoryImpl implements AnalyticsRepository {
  const AnalyticsRepositoryImpl({
    required AnalyticsRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _kpiNamespace = 'analytics.kpis';
  static const String _dashboardNamespace = 'analytics.dashboards';
  static const String _reportNamespace = 'analytics.reports';
  static const String _pipelineNamespace = 'analytics.pipelines';

  final AnalyticsRemoteDataSource _remote;
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
      final cached = _cache.read<Map<String, dynamic>>(_tenantId, namespace, query.cacheKey);
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
  Future<Result<Cacheable<Paginated<AnalyticsKpi>>>> listKpis(ListQuery query) =>
      _paginated(_kpiNamespace, query, () => _remote.listKpis(query),
        AnalyticsKpiModel.fromJson,);

  @override
  Future<Result<AnalyticsKpi>> getKpi(String id) =>
      _single(() => _remote.getKpi(id));

  @override
  Future<Result<AnalyticsKpi>> createKpi(Map<String, dynamic> p) =>
      _write(() => _remote.createKpi(p));

  @override
  Future<Result<AnalyticsKpi>> updateKpi(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateKpi(id, p));

  @override
  Future<Result<void>> deleteKpi(String id) =>
      _delete(() => _remote.deleteKpi(id));

  @override
  Future<Result<Cacheable<Paginated<AnalyticsDashboard>>>> listDashboards(
    ListQuery query,) =>
      _paginated(_dashboardNamespace, query, () => _remote.listDashboards(query),
        AnalyticsDashboardModel.fromJson,);

  @override
  Future<Result<AnalyticsDashboard>> getDashboard(String id) =>
      _single(() => _remote.getDashboard(id));

  @override
  Future<Result<AnalyticsDashboard>> createDashboard(Map<String, dynamic> p) =>
      _write(() => _remote.createDashboard(p));

  @override
  Future<Result<AnalyticsDashboard>> updateDashboard(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateDashboard(id, p));

  @override
  Future<Result<void>> deleteDashboard(String id) =>
      _delete(() => _remote.deleteDashboard(id));

  @override
  Future<Result<Cacheable<Paginated<AnalyticsReport>>>> listReports(
    ListQuery query,) =>
      _paginated(_reportNamespace, query, () => _remote.listReports(query),
        AnalyticsReportModel.fromJson,);

  @override
  Future<Result<AnalyticsReport>> getReport(String id) =>
      _single(() => _remote.getReport(id));

  @override
  Future<Result<AnalyticsReport>> createReport(Map<String, dynamic> p) =>
      _write(() => _remote.createReport(p));

  @override
  Future<Result<AnalyticsReport>> updateReport(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateReport(id, p));

  @override
  Future<Result<void>> deleteReport(String id) =>
      _delete(() => _remote.deleteReport(id));

  @override
  Future<Result<Cacheable<Paginated<AnalyticsPipeline>>>> listPipelines(
    ListQuery query,) =>
      _paginated(_pipelineNamespace, query, () => _remote.listPipelines(query),
        AnalyticsPipelineModel.fromJson,);
}
