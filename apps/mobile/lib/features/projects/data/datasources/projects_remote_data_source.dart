import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/projects_models.dart';

abstract class ProjectsRemoteDataSource {
  Future<Paginated<ProjectModel>> listProjects(ListQuery query);
  Future<ProjectModel> getProject(String id);
  Future<ProjectModel> createProject(Map<String, dynamic> payload);
  Future<ProjectModel> updateProject(String id, Map<String, dynamic> payload);
  Future<void> deleteProject(String id);

  Future<Paginated<TaskModel>> listTasks(ListQuery query);
  Future<Paginated<TaskModel>> listProjectTasks(String projectId, ListQuery query);
  Future<TaskModel> getTask(String id);
  Future<TaskModel> createTask(Map<String, dynamic> payload);
  Future<TaskModel> updateTask(String id, Map<String, dynamic> payload);
  Future<void> deleteTask(String id);

  Future<Paginated<MilestoneModel>> listMilestones(ListQuery query);
  Future<Paginated<MilestoneModel>> listProjectMilestones(String projectId, ListQuery query);
  Future<MilestoneModel> getMilestone(String id);
  Future<MilestoneModel> createMilestone(Map<String, dynamic> payload);
  Future<MilestoneModel> updateMilestone(String id, Map<String, dynamic> payload);
  Future<void> deleteMilestone(String id);

  Future<Paginated<TimesheetModel>> listTimesheets(ListQuery query);
  Future<TimesheetModel> approveTimesheet(String id);

  Future<Paginated<ProjectBudgetModel>> listProjectBudgets(String projectId);
}

class ProjectsRemoteDataSourceImpl implements ProjectsRemoteDataSource {
  const ProjectsRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<ProjectModel>> listProjects(ListQuery query) =>
      _client.getPaginated<ProjectModel>(
        ApiPaths.projects, query, ProjectModel.fromJson);

  @override
  Future<ProjectModel> getProject(String id) async =>
      ProjectModel.fromJson(
        await _client.getObject(ApiPaths.project(id)));

  @override
  Future<ProjectModel> createProject(Map<String, dynamic> payload) async =>
      ProjectModel.fromJson(
        await _client.post(ApiPaths.projects, body: payload));

  @override
  Future<ProjectModel> updateProject(
    String id, Map<String, dynamic> payload) async =>
      ProjectModel.fromJson(
        await _client.patch(ApiPaths.project(id), body: payload));

  @override
  Future<void> deleteProject(String id) =>
      _client.delete(ApiPaths.project(id));

  @override
  Future<Paginated<TaskModel>> listTasks(ListQuery query) =>
      _client.getPaginated<TaskModel>(
        ApiPaths.tasks, query, TaskModel.fromJson);

  @override
  Future<Paginated<TaskModel>> listProjectTasks(
    String projectId, ListQuery query) =>
      _client.getPaginated<TaskModel>(
        ApiPaths.projectTasks(projectId), query, TaskModel.fromJson);

  @override
  Future<TaskModel> getTask(String id) async =>
      TaskModel.fromJson(
        await _client.getObject(ApiPaths.taskDetail(id)));

  @override
  Future<TaskModel> createTask(Map<String, dynamic> payload) async =>
      TaskModel.fromJson(
        await _client.post(ApiPaths.tasks, body: payload));

  @override
  Future<TaskModel> updateTask(
    String id, Map<String, dynamic> payload) async =>
      TaskModel.fromJson(
        await _client.patch(ApiPaths.taskDetail(id), body: payload));

  @override
  Future<void> deleteTask(String id) =>
      _client.delete(ApiPaths.taskDetail(id));

  @override
  Future<Paginated<MilestoneModel>> listMilestones(ListQuery query) =>
      _client.getPaginated<MilestoneModel>(
        ApiPaths.milestones, query, MilestoneModel.fromJson);

  @override
  Future<Paginated<MilestoneModel>> listProjectMilestones(
    String projectId, ListQuery query) =>
      _client.getPaginated<MilestoneModel>(
        ApiPaths.projectMilestones(projectId), query, MilestoneModel.fromJson);

  @override
  Future<MilestoneModel> getMilestone(String id) async =>
      MilestoneModel.fromJson(
        await _client.getObject(ApiPaths.milestoneDetail(id)));

  @override
  Future<MilestoneModel> createMilestone(Map<String, dynamic> payload) async =>
      MilestoneModel.fromJson(
        await _client.post(ApiPaths.milestones, body: payload));

  @override
  Future<MilestoneModel> updateMilestone(
    String id, Map<String, dynamic> payload) async =>
      MilestoneModel.fromJson(
        await _client.patch(ApiPaths.milestoneDetail(id), body: payload));

  @override
  Future<void> deleteMilestone(String id) =>
      _client.delete(ApiPaths.milestoneDetail(id));

  @override
  Future<Paginated<TimesheetModel>> listTimesheets(ListQuery query) =>
      _client.getPaginated<TimesheetModel>(
        ApiPaths.projectTimesheets, query, TimesheetModel.fromJson);

  @override
  Future<TimesheetModel> approveTimesheet(String id) async =>
      TimesheetModel.fromJson(
        await _client.post(ApiPaths.projectTimesheetApprove(id)));

  @override
  Future<Paginated<ProjectBudgetModel>> listProjectBudgets(
    String projectId) =>
      _client.getPaginated<ProjectBudgetModel>(
        ApiPaths.projectBudgets(projectId), const ListQuery(limit: 100),
        ProjectBudgetModel.fromJson);
}
