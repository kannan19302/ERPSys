import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/workflow.dart';
import '../../domain/repositories/workflow_repository.dart';
import '../datasources/workflow_remote_data_source.dart';
import '../models/workflow_models.dart';

class WorkflowRepositoryImpl implements WorkflowRepository {
  const WorkflowRepositoryImpl({
    required WorkflowRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _definitionNamespace = 'workflow.definitions';
  static const String _instanceNamespace = 'workflow.instances';
  static const String _taskNamespace = 'workflow.tasks';
  static const String _slaNamespace = 'workflow.sla-rules';

  final WorkflowRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<WorkflowDefinition>>>> listWorkflowDefinitions(ListQuery query) =>
      _paginated(_definitionNamespace, query,
        () => _remote.listWorkflowDefinitions(query),
        WorkflowDefinitionModel.fromJson,);

  @override
  Future<Result<WorkflowDefinition>> getWorkflowDefinition(String id) =>
      _single(() => _remote.getWorkflowDefinition(id));

  @override
  Future<Result<WorkflowDefinition>> createWorkflowDefinition(Map<String, dynamic> payload) =>
      _write(() => _remote.createWorkflowDefinition(payload));

  @override
  Future<Result<WorkflowDefinition>> updateWorkflowDefinition(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.updateWorkflowDefinition(id, payload));

  @override
  Future<Result<void>> deleteWorkflowDefinition(String id) =>
      _delete(() => _remote.deleteWorkflowDefinition(id));

  @override
  Future<Result<WorkflowDefinition>> activateWorkflowDefinition(String id) =>
      _single(() => _remote.activateWorkflowDefinition(id));

  @override
  Future<Result<WorkflowDefinition>> deactivateWorkflowDefinition(String id) =>
      _single(() => _remote.deactivateWorkflowDefinition(id));

  @override
  Future<Result<Cacheable<Paginated<WorkflowInstance>>>> listWorkflowInstances(ListQuery query) =>
      _paginated(_instanceNamespace, query,
        () => _remote.listWorkflowInstances(query),
        WorkflowInstanceModel.fromJson,);

  @override
  Future<Result<WorkflowInstance>> getWorkflowInstance(String id) =>
      _single(() => _remote.getWorkflowInstance(id));

  @override
  Future<Result<WorkflowInstance>> createWorkflowInstance(Map<String, dynamic> payload) =>
      _write(() => _remote.createWorkflowInstance(payload));

  @override
  Future<Result<WorkflowInstance>> advanceWorkflowInstance(String id) =>
      _single(() => _remote.advanceWorkflowInstance(id));

  @override
  Future<Result<WorkflowInstance>> cancelWorkflowInstance(String id) =>
      _single(() => _remote.cancelWorkflowInstance(id));

  @override
  Future<Result<Cacheable<Paginated<WorkflowTask>>>> listWorkflowTasks(ListQuery query) =>
      _paginated(_taskNamespace, query,
        () => _remote.listWorkflowTasks(query),
        WorkflowTaskModel.fromJson,);

  @override
  Future<Result<WorkflowTask>> approveWorkflowTask(String id) =>
      _single(() => _remote.approveWorkflowTask(id));

  @override
  Future<Result<WorkflowTask>> rejectWorkflowTask(String id) =>
      _single(() => _remote.rejectWorkflowTask(id));

  @override
  Future<Result<WorkflowTask>> delegateWorkflowTask(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.delegateWorkflowTask(id, payload));

  @override
  Future<Result<WorkflowTask>> escalateWorkflowTask(String id) =>
      _single(() => _remote.escalateWorkflowTask(id));

  @override
  Future<Result<Cacheable<Paginated<SlaRule>>>> listSlaRules(ListQuery query) =>
      _paginated(_slaNamespace, query,
        () => _remote.listSlaRules(query),
        SlaRuleModel.fromJson,);

  @override
  Future<Result<SlaRule>> createSlaRule(Map<String, dynamic> payload) =>
      _write(() => _remote.createSlaRule(payload));

  @override
  Future<Result<SlaRule>> updateSlaRule(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.updateSlaRule(id, payload));

  @override
  Future<Result<void>> deleteSlaRule(String id) =>
      _delete(() => _remote.deleteSlaRule(id));

  @override
  Future<Result<WorkflowDefinition>> createDefinition(Map<String, dynamic> p) async => throw UnimplementedError();

  @override
  Future<Result<WorkflowTask>> createTask(Map<String, dynamic> p) async => throw UnimplementedError();

  @override
  Future<Result<WorkflowTask>> createWorkflowTask(Map<String, dynamic> p) async => throw UnimplementedError();

  @override
  Future<Result<WorkflowTask>> getWorkflowTask(String id) async => throw UnimplementedError();

  @override
  Future<Result<WorkflowDefinition>> updateDefinition(String id, Map<String, dynamic> p) async => throw UnimplementedError();

  @override
  Future<Result<WorkflowTask>> updateTask(String id, Map<String, dynamic> p) async => throw UnimplementedError();

  @override
  Future<Result<WorkflowTask>> updateWorkflowTask(String id, Map<String, dynamic> p) async => throw UnimplementedError();

}
