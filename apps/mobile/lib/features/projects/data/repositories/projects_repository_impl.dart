import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/projects.dart';
import '../../domain/repositories/projects_repository.dart';
import '../datasources/projects_remote_data_source.dart';
import '../models/projects_models.dart';

class ProjectsRepositoryImpl implements ProjectsRepository {
  const ProjectsRepositoryImpl({
    required ProjectsRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _projectNamespace = 'projects.projects';
  static const String _taskNamespace = 'projects.tasks';
  static const String _milestoneNamespace = 'projects.milestones';
  static const String _timesheetNamespace = 'projects.timesheets';
  static const String _budgetNamespace = 'projects.budgets';

  final ProjectsRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<Project>>>> listProjects(ListQuery query) =>
      _paginated(_projectNamespace, query, () => _remote.listProjects(query),
        ProjectModel.fromJson);

  @override
  Future<Result<Project>> getProject(String id) =>
      _single(() => _remote.getProject(id));

  @override
  Future<Result<Project>> createProject(Map<String, dynamic> p) =>
      _write(() => _remote.createProject(p));

  @override
  Future<Result<Project>> updateProject(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateProject(id, p));

  @override
  Future<Result<void>> deleteProject(String id) =>
      _delete(() => _remote.deleteProject(id));

  @override
  Future<Result<Cacheable<Paginated<Task>>>> listTasks(ListQuery q) =>
      _paginated(_taskNamespace, q, () => _remote.listTasks(q),
        TaskModel.fromJson);

  @override
  Future<Result<Cacheable<Paginated<Task>>>> listProjectTasks(
    String projectId, ListQuery q) =>
      _paginated('$_taskNamespace.$projectId', q,
        () => _remote.listProjectTasks(projectId, q),
        TaskModel.fromJson);

  @override
  Future<Result<Task>> getTask(String id) =>
      _single(() => _remote.getTask(id));

  @override
  Future<Result<Task>> createTask(Map<String, dynamic> p) =>
      _write(() => _remote.createTask(p));

  @override
  Future<Result<Task>> updateTask(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateTask(id, p));

  @override
  Future<Result<void>> deleteTask(String id) =>
      _delete(() => _remote.deleteTask(id));

  @override
  Future<Result<Cacheable<Paginated<Milestone>>>> listMilestones(ListQuery q) =>
      _paginated(_milestoneNamespace, q, () => _remote.listMilestones(q),
        MilestoneModel.fromJson);

  @override
  Future<Result<Cacheable<Paginated<Milestone>>>> listProjectMilestones(
    String projectId, ListQuery q) =>
      _paginated('$_milestoneNamespace.$projectId', q,
        () => _remote.listProjectMilestones(projectId, q),
        MilestoneModel.fromJson);

  @override
  Future<Result<Milestone>> getMilestone(String id) =>
      _single(() => _remote.getMilestone(id));

  @override
  Future<Result<Milestone>> createMilestone(Map<String, dynamic> p) =>
      _write(() => _remote.createMilestone(p));

  @override
  Future<Result<Milestone>> updateMilestone(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateMilestone(id, p));

  @override
  Future<Result<void>> deleteMilestone(String id) =>
      _delete(() => _remote.deleteMilestone(id));

  @override
  Future<Result<Cacheable<Paginated<Timesheet>>>> listTimesheets(ListQuery q) =>
      _paginated(_timesheetNamespace, q, () => _remote.listTimesheets(q),
        TimesheetModel.fromJson);

  @override
  Future<Result<Timesheet>> approveTimesheet(String id) =>
      _single(() => _remote.approveTimesheet(id));

  @override
  Future<Result<Cacheable<Paginated<ProjectBudget>>>> listProjectBudgets(
    String projectId) =>
      _paginated('$_budgetNamespace.$projectId', const ListQuery(limit: 100),
        () => _remote.listProjectBudgets(projectId),
        ProjectBudgetModel.fromJson);
}
