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
  Future<Result<Timesheet>> getTimesheet(String id);
  Future<Result<Timesheet>> createTimesheet(Map<String, dynamic> payload);
  Future<Result<Timesheet>> updateTimesheet(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteTimesheet(String id);
  Future<Result<Timesheet>> approveTimesheet(String id);

  Future<Result<Cacheable<Paginated<ProjectBudget>>>> listProjectBudgets(
    String projectId);
  Future<Result<ProjectBudget>> getProjectBudget(String id);
  Future<Result<ProjectBudget>> createProjectBudget(Map<String, dynamic> payload);
  Future<Result<ProjectBudget>> updateProjectBudget(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteProjectBudget(String id);

  Future<Result<Cacheable<Paginated<ProjectRisk>>>> listProjectRisks(
    String projectId);
  Future<Result<ProjectRisk>> getProjectRisk(String id);
  Future<Result<ProjectRisk>> createProjectRisk(Map<String, dynamic> payload);
  Future<Result<ProjectRisk>> updateProjectRisk(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteProjectRisk(String id);

  Future<Result<Cacheable<Paginated<ProjectPortfolio>>>> listProjectPortfolios(
    ListQuery query);
  Future<Result<ProjectPortfolio>> getProjectPortfolio(String id);
  Future<Result<ProjectPortfolio>> createProjectPortfolio(
    Map<String, dynamic> payload);
  Future<Result<ProjectPortfolio>> updateProjectPortfolio(
    String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteProjectPortfolio(String id);
}