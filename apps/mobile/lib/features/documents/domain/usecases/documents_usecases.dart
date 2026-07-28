import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/documents.dart';
import '../repositories/documents_repository.dart';

class ListFoldersUseCase extends UseCase<Cacheable<Paginated<DocumentFolder>>, ListQuery> {
  const ListFoldersUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<DocumentFolder>>>> call(ListQuery params) =>
      _repository.listFolders(params);
}

class GetFolderUseCase extends UseCase<DocumentFolder, String> {
  const GetFolderUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<DocumentFolder>> call(String id) => _repository.getFolder(id);
}

class SaveFolderParams {
  const SaveFolderParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveFolderUseCase extends UseCase<DocumentFolder, SaveFolderParams> {
  const SaveFolderUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<DocumentFolder>> call(SaveFolderParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createFolder(params.payload)
        : _repository.updateFolder(id, params.payload);
  }
}

class DeleteFolderUseCase extends UseCase<void, String> {
  const DeleteFolderUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteFolder(id);
}

class ListDocumentsUseCase extends UseCase<Cacheable<Paginated<Document>>, ListQuery> {
  const ListDocumentsUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Document>>>> call(ListQuery params) =>
      _repository.listDocuments(params);
}

class GetDocumentUseCase extends UseCase<Document, String> {
  const GetDocumentUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<Document>> call(String id) => _repository.getDocument(id);
}

class SaveDocumentParams {
  const SaveDocumentParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveDocumentUseCase extends UseCase<Document, SaveDocumentParams> {
  const SaveDocumentUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<Document>> call(SaveDocumentParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createDocument(params.payload)
        : _repository.updateDocument(id, params.payload);
  }
}

class DeleteDocumentUseCase extends UseCase<void, String> {
  const DeleteDocumentUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteDocument(id);
}

class StarDocumentUseCase extends UseCase<Document, String> {
  const StarDocumentUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<Document>> call(String id) => _repository.starDocument(id);
}

class ApproveDocumentUseCase extends UseCase<Document, String> {
  const ApproveDocumentUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<Document>> call(String id) => _repository.approveDocument(id);
}

class SignDocumentUseCase extends UseCase<Document, String> {
  const SignDocumentUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<Document>> call(String id) => _repository.signDocument(id);
}

class ListDocumentVersionsParams {
  const ListDocumentVersionsParams({required this.documentId, required this.query});
  final String documentId;
  final ListQuery query;
}

class ListDocumentVersionsUseCase extends UseCase<Cacheable<Paginated<DocumentVersion>>, ListDocumentVersionsParams> {
  const ListDocumentVersionsUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<DocumentVersion>>>> call(ListDocumentVersionsParams params) =>
      _repository.listDocumentVersions(params.documentId, params.query);
}

class ListTemplatesUseCase extends UseCase<Cacheable<Paginated<DocumentTemplate>>, ListQuery> {
  const ListTemplatesUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<DocumentTemplate>>>> call(ListQuery params) =>
      _repository.listTemplates(params);
}

class GetTemplateUseCase extends UseCase<DocumentTemplate, String> {
  const GetTemplateUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<DocumentTemplate>> call(String id) => _repository.getTemplate(id);
}

class SaveTemplateParams {
  const SaveTemplateParams({required this.payload, this.id});

  /// null when creating, set when updating.
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveTemplateUseCase extends UseCase<DocumentTemplate, SaveTemplateParams> {
  const SaveTemplateUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<DocumentTemplate>> call(SaveTemplateParams params) =>
      _repository.createTemplate(params.payload);
}

class DeleteTemplateUseCase extends UseCase<void, String> {
  const DeleteTemplateUseCase(this._repository);
  final DocumentsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteTemplate(id);
}
