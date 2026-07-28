import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/builder.dart';
import '../repositories/builder_repository.dart';

class ListBuilderFormsUseCase extends UseCase<Cacheable<Paginated<BuilderForm>>, ListQuery> {
  const ListBuilderFormsUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<BuilderForm>>>> call(ListQuery params) =>
      _repository.listForms(params);
}

class GetBuilderFormUseCase extends UseCase<BuilderForm, String> {
  const GetBuilderFormUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<BuilderForm>> call(String id) => _repository.getForm(id);
}

class SaveBuilderFormParams {
  const SaveBuilderFormParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveBuilderFormUseCase extends UseCase<BuilderForm, SaveBuilderFormParams> {
  const SaveBuilderFormUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<BuilderForm>> call(SaveBuilderFormParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createForm(params.payload)
        : _repository.updateForm(id, params.payload);
  }
}

class DeleteBuilderFormUseCase extends UseCase<void, String> {
  const DeleteBuilderFormUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteForm(id);
}

class ListBuilderPagesUseCase extends UseCase<Cacheable<Paginated<BuilderPage>>, ListQuery> {
  const ListBuilderPagesUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<BuilderPage>>>> call(ListQuery params) =>
      _repository.listPages(params);
}

class GetBuilderPageUseCase extends UseCase<BuilderPage, String> {
  const GetBuilderPageUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<BuilderPage>> call(String id) => _repository.getPage(id);
}

class SaveBuilderPageParams {
  const SaveBuilderPageParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveBuilderPageUseCase extends UseCase<BuilderPage, SaveBuilderPageParams> {
  const SaveBuilderPageUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<BuilderPage>> call(SaveBuilderPageParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPage(params.payload)
        : _repository.updatePage(id, params.payload);
  }
}

class DeleteBuilderPageUseCase extends UseCase<void, String> {
  const DeleteBuilderPageUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deletePage(id);
}

class ListBuilderWorkflowsUseCase extends UseCase<Cacheable<Paginated<BuilderWorkflow>>, ListQuery> {
  const ListBuilderWorkflowsUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<BuilderWorkflow>>>> call(ListQuery params) =>
      _repository.listWorkflows(params);
}

class GetBuilderWorkflowUseCase extends UseCase<BuilderWorkflow, String> {
  const GetBuilderWorkflowUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<BuilderWorkflow>> call(String id) => _repository.getWorkflow(id);
}

class SaveBuilderWorkflowParams {
  const SaveBuilderWorkflowParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveBuilderWorkflowUseCase extends UseCase<BuilderWorkflow, SaveBuilderWorkflowParams> {
  const SaveBuilderWorkflowUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<BuilderWorkflow>> call(SaveBuilderWorkflowParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createWorkflow(params.payload)
        : _repository.updateWorkflow(id, params.payload);
  }
}

class DeleteBuilderWorkflowUseCase extends UseCase<void, String> {
  const DeleteBuilderWorkflowUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteWorkflow(id);
}

class ListBuilderTemplatesUseCase extends UseCase<Cacheable<Paginated<BuilderTemplate>>, ListQuery> {
  const ListBuilderTemplatesUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<BuilderTemplate>>>> call(ListQuery params) =>
      _repository.listTemplates(params);
}

class GetBuilderTemplateUseCase extends UseCase<BuilderTemplate, String> {
  const GetBuilderTemplateUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<BuilderTemplate>> call(String id) => _repository.getTemplate(id);
}

class SaveBuilderTemplateParams {
  const SaveBuilderTemplateParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveBuilderTemplateUseCase extends UseCase<BuilderTemplate, SaveBuilderTemplateParams> {
  const SaveBuilderTemplateUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<BuilderTemplate>> call(SaveBuilderTemplateParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createTemplate(params.payload)
        : _repository.updateTemplate(id, params.payload);
  }
}

class DeleteBuilderTemplateUseCase extends UseCase<void, String> {
  const DeleteBuilderTemplateUseCase(this._repository);
  final BuilderRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteTemplate(id);
}