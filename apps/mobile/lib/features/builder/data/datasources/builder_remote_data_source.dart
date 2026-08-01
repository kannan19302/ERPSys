import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/builder_models.dart';

abstract class BuilderRemoteDataSource {
  Future<Paginated<BuilderFormModel>> listForms(ListQuery query);
  Future<BuilderFormModel> getForm(String id);
  Future<BuilderFormModel> createForm(Map<String, dynamic> payload);
  Future<BuilderFormModel> updateForm(String id, Map<String, dynamic> payload);
  Future<void> deleteForm(String id);

  Future<Paginated<BuilderPageModel>> listPages(ListQuery query);
  Future<BuilderPageModel> getPage(String id);
  Future<BuilderPageModel> createPage(Map<String, dynamic> payload);
  Future<BuilderPageModel> updatePage(String id, Map<String, dynamic> payload);
  Future<void> deletePage(String id);

  Future<Paginated<BuilderWorkflowModel>> listWorkflows(ListQuery query);
  Future<BuilderWorkflowModel> getWorkflow(String id);
  Future<BuilderWorkflowModel> createWorkflow(Map<String, dynamic> payload);
  Future<BuilderWorkflowModel> updateWorkflow(String id, Map<String, dynamic> payload);
  Future<void> deleteWorkflow(String id);

  Future<Paginated<BuilderTemplateModel>> listTemplates(ListQuery query);
  Future<BuilderTemplateModel> getTemplate(String id);
  Future<BuilderTemplateModel> createTemplate(Map<String, dynamic> payload);
  Future<BuilderTemplateModel> updateTemplate(String id, Map<String, dynamic> payload);
  Future<void> deleteTemplate(String id);
}

class BuilderRemoteDataSourceImpl implements BuilderRemoteDataSource {
  const BuilderRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<BuilderFormModel>> listForms(ListQuery query) =>
      _client.getPaginated<BuilderFormModel>(
        ApiPaths.builderForms, query, BuilderFormModel.fromJson,);

  @override
  Future<BuilderFormModel> getForm(String id) async =>
      BuilderFormModel.fromJson(
        await _client.getObject(ApiPaths.builderForm(id)),);

  @override
  Future<BuilderFormModel> createForm(Map<String, dynamic> payload) async =>
      BuilderFormModel.fromJson(
        await _client.post(ApiPaths.builderForms, body: payload),);

  @override
  Future<BuilderFormModel> updateForm(String id, Map<String, dynamic> payload) async =>
      BuilderFormModel.fromJson(
        await _client.patch(ApiPaths.builderForm(id), body: payload),);

  @override
  Future<void> deleteForm(String id) =>
      _client.delete(ApiPaths.builderForm(id));

  @override
  Future<Paginated<BuilderPageModel>> listPages(ListQuery query) =>
      _client.getPaginated<BuilderPageModel>(
        ApiPaths.builderPages, query, BuilderPageModel.fromJson,);

  @override
  Future<BuilderPageModel> getPage(String id) async =>
      BuilderPageModel.fromJson(
        await _client.getObject(ApiPaths.builderPage(id)),);

  @override
  Future<BuilderPageModel> createPage(Map<String, dynamic> payload) async =>
      BuilderPageModel.fromJson(
        await _client.post(ApiPaths.builderPages, body: payload),);

  @override
  Future<BuilderPageModel> updatePage(String id, Map<String, dynamic> payload) async =>
      BuilderPageModel.fromJson(
        await _client.patch(ApiPaths.builderPage(id), body: payload),);

  @override
  Future<void> deletePage(String id) =>
      _client.delete(ApiPaths.builderPage(id));

  @override
  Future<Paginated<BuilderWorkflowModel>> listWorkflows(ListQuery query) =>
      _client.getPaginated<BuilderWorkflowModel>(
        ApiPaths.builderWorkflows, query, BuilderWorkflowModel.fromJson,);

  @override
  Future<BuilderWorkflowModel> getWorkflow(String id) async =>
      BuilderWorkflowModel.fromJson(
        await _client.getObject(ApiPaths.builderWorkflow(id)),);

  @override
  Future<BuilderWorkflowModel> createWorkflow(Map<String, dynamic> payload) async =>
      BuilderWorkflowModel.fromJson(
        await _client.post(ApiPaths.builderWorkflows, body: payload),);

  @override
  Future<BuilderWorkflowModel> updateWorkflow(String id, Map<String, dynamic> payload) async =>
      BuilderWorkflowModel.fromJson(
        await _client.patch(ApiPaths.builderWorkflow(id), body: payload),);

  @override
  Future<void> deleteWorkflow(String id) =>
      _client.delete(ApiPaths.builderWorkflow(id));

  @override
  Future<Paginated<BuilderTemplateModel>> listTemplates(ListQuery query) =>
      _client.getPaginated<BuilderTemplateModel>(
        ApiPaths.builderTemplates, query, BuilderTemplateModel.fromJson,);

  @override
  Future<BuilderTemplateModel> getTemplate(String id) async =>
      BuilderTemplateModel.fromJson(
        await _client.getObject(ApiPaths.builderTemplate(id)),);

  @override
  Future<BuilderTemplateModel> createTemplate(Map<String, dynamic> payload) async =>
      BuilderTemplateModel.fromJson(
        await _client.post(ApiPaths.builderTemplates, body: payload),);

  @override
  Future<BuilderTemplateModel> updateTemplate(String id, Map<String, dynamic> payload) async =>
      BuilderTemplateModel.fromJson(
        await _client.patch(ApiPaths.builderTemplate(id), body: payload),);

  @override
  Future<void> deleteTemplate(String id) =>
      _client.delete(ApiPaths.builderTemplate(id));
}