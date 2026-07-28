import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/builder.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class BuilderRepository {
  Future<Result<Cacheable<Paginated<BuilderForm>>>> listForms(ListQuery query);
  Future<Result<BuilderForm>> getForm(String id);
  Future<Result<BuilderForm>> createForm(Map<String, dynamic> payload);
  Future<Result<BuilderForm>> updateForm(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteForm(String id);

  Future<Result<Cacheable<Paginated<BuilderPage>>>> listPages(ListQuery query);
  Future<Result<BuilderPage>> getPage(String id);
  Future<Result<BuilderPage>> createPage(Map<String, dynamic> payload);
  Future<Result<BuilderPage>> updatePage(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePage(String id);

  Future<Result<Cacheable<Paginated<BuilderWorkflow>>>> listWorkflows(ListQuery query);
  Future<Result<BuilderWorkflow>> getWorkflow(String id);
  Future<Result<BuilderWorkflow>> createWorkflow(Map<String, dynamic> payload);
  Future<Result<BuilderWorkflow>> updateWorkflow(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteWorkflow(String id);

  Future<Result<Cacheable<Paginated<BuilderTemplate>>>> listTemplates(ListQuery query);
  Future<Result<BuilderTemplate>> getTemplate(String id);
  Future<Result<BuilderTemplate>> createTemplate(Map<String, dynamic> payload);
  Future<Result<BuilderTemplate>> updateTemplate(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteTemplate(String id);
}