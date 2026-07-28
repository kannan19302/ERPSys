import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/builder.dart';
import '../../domain/repositories/builder_repository.dart';
import '../datasources/builder_remote_data_source.dart';
import '../models/builder_models.dart';

class BuilderRepositoryImpl implements BuilderRepository {
  const BuilderRepositoryImpl({
    required BuilderRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _formNamespace = 'builder.forms';
  static const String _pageNamespace = 'builder.pages';
  static const String _workflowNamespace = 'builder.workflows';
  static const String _templateNamespace = 'builder.templates';

  final BuilderRemoteDataSource _remote;
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
      final jsonItems = page.data
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
  Future<Result<Cacheable<Paginated<BuilderForm>>>> listForms(ListQuery q) =>
      _paginated(_formNamespace, q, () => _remote.listForms(q), BuilderFormModel.fromJson);

  @override
  Future<Result<BuilderForm>> getForm(String id) => _single(() => _remote.getForm(id));

  @override
  Future<Result<BuilderForm>> createForm(Map<String, dynamic> p) =>
      _write(() => _remote.createForm(p));

  @override
  Future<Result<BuilderForm>> updateForm(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateForm(id, p));

  @override
  Future<Result<void>> deleteForm(String id) => _delete(() => _remote.deleteForm(id));

  @override
  Future<Result<Cacheable<Paginated<BuilderPage>>>> listPages(ListQuery q) =>
      _paginated(_pageNamespace, q, () => _remote.listPages(q), BuilderPageModel.fromJson);

  @override
  Future<Result<BuilderPage>> getPage(String id) => _single(() => _remote.getPage(id));

  @override
  Future<Result<BuilderPage>> createPage(Map<String, dynamic> p) =>
      _write(() => _remote.createPage(p));

  @override
  Future<Result<BuilderPage>> updatePage(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updatePage(id, p));

  @override
  Future<Result<void>> deletePage(String id) => _delete(() => _remote.deletePage(id));

  @override
  Future<Result<Cacheable<Paginated<BuilderWorkflow>>>> listWorkflows(ListQuery q) =>
      _paginated(_workflowNamespace, q, () => _remote.listWorkflows(q), BuilderWorkflowModel.fromJson);

  @override
  Future<Result<BuilderWorkflow>> getWorkflow(String id) => _single(() => _remote.getWorkflow(id));

  @override
  Future<Result<BuilderWorkflow>> createWorkflow(Map<String, dynamic> p) =>
      _write(() => _remote.createWorkflow(p));

  @override
  Future<Result<BuilderWorkflow>> updateWorkflow(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateWorkflow(id, p));

  @override
  Future<Result<void>> deleteWorkflow(String id) => _delete(() => _remote.deleteWorkflow(id));

  @override
  Future<Result<Cacheable<Paginated<BuilderTemplate>>>> listTemplates(ListQuery q) =>
      _paginated(_templateNamespace, q, () => _remote.listTemplates(q), BuilderTemplateModel.fromJson);

  @override
  Future<Result<BuilderTemplate>> getTemplate(String id) => _single(() => _remote.getTemplate(id));

  @override
  Future<Result<BuilderTemplate>> createTemplate(Map<String, dynamic> p) =>
      _write(() => _remote.createTemplate(p));

  @override
  Future<Result<BuilderTemplate>> updateTemplate(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateTemplate(id, p));

  @override
  Future<Result<void>> deleteTemplate(String id) => _delete(() => _remote.deleteTemplate(id));
}