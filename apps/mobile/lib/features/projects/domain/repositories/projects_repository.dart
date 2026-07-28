import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/projects.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class ProjectsRepository {
  Future<Result<Cacheable<Paginated<Project>>>> listProjects(ListQuery query);
  Future<Result<Project>> getProject(String id);
  Future<Result<Project>> createProject(Map<String, dynamic> payload);
  Future<Result<Project>> updateProject(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteProject(String id);

  Future<Result<Cacheable<Paginated<Task>>>> listTasks(ListQuery query);
  Future<Result<Cacheable<Paginated<Task>>>> listProjectTasks(
    String projectId, ListQuery query);
  Future<Result<Task>> getTask(String id);
  Future<Result<Task>> createTask(Map<String, dynamic> payload);
  Future<Result<Task>> updateTask(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteTask(String id);

  Future<Result<Cacheable<Paginated<Milestone>>>> listMilestones(ListQuery query);
  Future<Result<Cacheable<Paginated<Milestone>>>> listProjectMilestones(
    String projectId, ListQuery query);
  Future<Result<Milestone>> getMilestone(String id);
  Future<Result<Milestone>> createMilestone(Map<String, dynamic> payload);
  Future<Result<Milestone>> updateMilestone(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteMilestone(String id);

  Future<Result<Cacheable<Paginated<Timesheet>>>> listTimesheets(ListQuery query);
  Future<Result<Timesheet>> approveTimesheet(String id);

  Future<Result<Cacheable<Paginated<ProjectBudget>>>> listProjectBudgets(
    String projectId);
}
