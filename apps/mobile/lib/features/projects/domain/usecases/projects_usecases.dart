import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/projects.dart';
import '../repositories/projects_repository.dart';

// ── Project ──

class ListProjectsUseCase extends UseCase<Cacheable<Paginated<Project>>, ListQuery> {
  const ListProjectsUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Project>>>> call(ListQuery params) =>
      _repository.listProjects(params);
}

class GetProjectUseCase extends UseCase<Project, String> {
  const GetProjectUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Project>> call(String id) => _repository.getProject(id);
}

class SaveProjectParams {
  const SaveProjectParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveProjectUseCase extends UseCase<Project, SaveProjectParams> {
  const SaveProjectUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Project>> call(SaveProjectParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createProject(params.payload)
        : _repository.updateProject(id, params.payload);
  }
}

class DeleteProjectUseCase extends UseCase<void, String> {
  const DeleteProjectUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteProject(id);
}

// ── Task ──

class ListTasksUseCase extends UseCase<Cacheable<Paginated<Task>>, ListQuery> {
  const ListTasksUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Task>>>> call(ListQuery params) =>
      _repository.listTasks(params);
}

class ListProjectTasksUseCase extends UseCase<Cacheable<Paginated<Task>>, ListProjectTasksParams> {
  const ListProjectTasksUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Task>>>> call(ListProjectTasksParams params) =>
      _repository.listProjectTasks(params.projectId, params.query);
}

class ListProjectTasksParams {
  const ListProjectTasksParams({required this.projectId, required this.query});
  final String projectId;
  final ListQuery query;
}

class GetTaskUseCase extends UseCase<Task, String> {
  const GetTaskUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Task>> call(String id) => _repository.getTask(id);
}

class SaveTaskParams {
  const SaveTaskParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveTaskUseCase extends UseCase<Task, SaveTaskParams> {
  const SaveTaskUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Task>> call(SaveTaskParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createTask(params.payload)
        : _repository.updateTask(id, params.payload);
  }
}

class DeleteTaskUseCase extends UseCase<void, String> {
  const DeleteTaskUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteTask(id);
}

// ── Milestone ──

class ListMilestonesUseCase extends UseCase<Cacheable<Paginated<Milestone>>, ListQuery> {
  const ListMilestonesUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Milestone>>>> call(ListQuery params) =>
      _repository.listMilestones(params);
}

class ListProjectMilestonesUseCase extends UseCase<Cacheable<Paginated<Milestone>>, ListProjectMilestonesParams> {
  const ListProjectMilestonesUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Milestone>>>> call(ListProjectMilestonesParams params) =>
      _repository.listProjectMilestones(params.projectId, params.query);
}

class ListProjectMilestonesParams {
  const ListProjectMilestonesParams({required this.projectId, required this.query});
  final String projectId;
  final ListQuery query;
}

class GetMilestoneUseCase extends UseCase<Milestone, String> {
  const GetMilestoneUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Milestone>> call(String id) => _repository.getMilestone(id);
}

class SaveMilestoneParams {
  const SaveMilestoneParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveMilestoneUseCase extends UseCase<Milestone, SaveMilestoneParams> {
  const SaveMilestoneUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Milestone>> call(SaveMilestoneParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createMilestone(params.payload)
        : _repository.updateMilestone(id, params.payload);
  }
}

class DeleteMilestoneUseCase extends UseCase<void, String> {
  const DeleteMilestoneUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteMilestone(id);
}

// ── Timesheet ──

class ListTimesheetsUseCase extends UseCase<Cacheable<Paginated<Timesheet>>, ListQuery> {
  const ListTimesheetsUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Timesheet>>>> call(ListQuery params) =>
      _repository.listTimesheets(params);
}

class GetTimesheetUseCase extends UseCase<Timesheet, String> {
  const GetTimesheetUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Timesheet>> call(String id) => _repository.getTimesheet(id);
}

class SaveTimesheetParams {
  const SaveTimesheetParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveTimesheetUseCase extends UseCase<Timesheet, SaveTimesheetParams> {
  const SaveTimesheetUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Timesheet>> call(SaveTimesheetParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createTimesheet(params.payload)
        : _repository.updateTimesheet(id, params.payload);
  }
}

class DeleteTimesheetUseCase extends UseCase<void, String> {
  const DeleteTimesheetUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteTimesheet(id);
}

class ApproveTimesheetUseCase extends UseCase<Timesheet, String> {
  const ApproveTimesheetUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Timesheet>> call(String id) => _repository.approveTimesheet(id);
}

// ── Project Budget ──

class ListProjectBudgetsUseCase extends UseCase<Cacheable<Paginated<ProjectBudget>>, String> {
  const ListProjectBudgetsUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ProjectBudget>>>> call(String projectId) =>
      _repository.listProjectBudgets(projectId);
}

class GetProjectBudgetUseCase extends UseCase<ProjectBudget, String> {
  const GetProjectBudgetUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<ProjectBudget>> call(String id) => _repository.getProjectBudget(id);
}

class SaveProjectBudgetParams {
  const SaveProjectBudgetParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveProjectBudgetUseCase extends UseCase<ProjectBudget, SaveProjectBudgetParams> {
  const SaveProjectBudgetUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<ProjectBudget>> call(SaveProjectBudgetParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createProjectBudget(params.payload)
        : _repository.updateProjectBudget(id, params.payload);
  }
}

class DeleteProjectBudgetUseCase extends UseCase<void, String> {
  const DeleteProjectBudgetUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteProjectBudget(id);
}

// ── Project Risk ──

class ListProjectRisksUseCase extends UseCase<Cacheable<Paginated<ProjectRisk>>, String> {
  const ListProjectRisksUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ProjectRisk>>>> call(String projectId) =>
      _repository.listProjectRisks(projectId);
}

class GetProjectRiskUseCase extends UseCase<ProjectRisk, String> {
  const GetProjectRiskUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<ProjectRisk>> call(String id) => _repository.getProjectRisk(id);
}

class SaveProjectRiskParams {
  const SaveProjectRiskParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveProjectRiskUseCase extends UseCase<ProjectRisk, SaveProjectRiskParams> {
  const SaveProjectRiskUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<ProjectRisk>> call(SaveProjectRiskParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createProjectRisk(params.payload)
        : _repository.updateProjectRisk(id, params.payload);
  }
}

class DeleteProjectRiskUseCase extends UseCase<void, String> {
  const DeleteProjectRiskUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteProjectRisk(id);
}

// ── Project Portfolio ──

class ListProjectPortfoliosUseCase extends UseCase<Cacheable<Paginated<ProjectPortfolio>>, ListQuery> {
  const ListProjectPortfoliosUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ProjectPortfolio>>>> call(ListQuery params) =>
      _repository.listProjectPortfolios(params);
}

class GetProjectPortfolioUseCase extends UseCase<ProjectPortfolio, String> {
  const GetProjectPortfolioUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<ProjectPortfolio>> call(String id) => _repository.getProjectPortfolio(id);
}

class SaveProjectPortfolioParams {
  const SaveProjectPortfolioParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveProjectPortfolioUseCase extends UseCase<ProjectPortfolio, SaveProjectPortfolioParams> {
  const SaveProjectPortfolioUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<ProjectPortfolio>> call(SaveProjectPortfolioParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createProjectPortfolio(params.payload)
        : _repository.updateProjectPortfolio(id, params.payload);
  }
}

class DeleteProjectPortfolioUseCase extends UseCase<void, String> {
  const DeleteProjectPortfolioUseCase(this._repository);
  final ProjectsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteProjectPortfolio(id);
}