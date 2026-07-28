import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/reporting.dart';
import '../../domain/repositories/reporting_repository.dart';
import '../datasources/reporting_remote_data_source.dart';
import '../models/reporting_models.dart';

class ReportingRepositoryImpl implements ReportingRepository {
  const ReportingRepositoryImpl({
    required ReportingRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _templateNamespace = 'reporting.templates';
  static const String _jobNamespace = 'reporting.jobs';
  static const String _exportNamespace = 'reporting.exports';
  static const String _complianceNamespace = 'reporting.compliance';

  final ReportingRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<ReportTemplate>>>> listTemplates(
    ListQuery query) =>
      _paginated(_templateNamespace, query, () => _remote.listTemplates(query),
        ReportTemplateModel.fromJson);

  @override
  Future<Result<ReportTemplate>> getTemplate(String id) =>
      _single(() => _remote.getTemplate(id));

  @override
  Future<Result<ReportTemplate>> createTemplate(Map<String, dynamic> p) =>
      _write(() => _remote.createTemplate(p));

  @override
  Future<Result<ReportTemplate>> updateTemplate(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateTemplate(id, p));

  @override
  Future<Result<void>> deleteTemplate(String id) =>
      _delete(() => _remote.deleteTemplate(id));

  @override
  Future<Result<ReportTemplate>> generateTemplate(String id) =>
      _single(() => _remote.generateTemplate(id));

  @override
  Future<Result<Cacheable<Paginated<ReportJob>>>> listJobs(ListQuery query) =>
      _paginated(_jobNamespace, query, () => _remote.listJobs(query),
        ReportJobModel.fromJson);

  @override
  Future<Result<ReportJob>> getJob(String id) =>
      _single(() => _remote.getJob(id));

  @override
  Future<Result<Cacheable<Paginated<ReportExport>>>> listExports(
    ListQuery query) =>
      _paginated(_exportNamespace, query, () => _remote.listExports(query),
        ReportExportModel.fromJson);

  @override
  Future<Result<ReportExport>> getExport(String id) =>
      _single(() => _remote.getExport(id));

  @override
  Future<Result<Cacheable<Paginated<ReportCompliance>>>> listCompliance(
    ListQuery query) =>
      _paginated(_complianceNamespace, query, () => _remote.listCompliance(query),
        ReportComplianceModel.fromJson);
}
