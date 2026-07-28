import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/documents.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class DocumentsRepository {
  Future<Result<Cacheable<Paginated<DocumentFolder>>>> listFolders(ListQuery query);
  Future<Result<DocumentFolder>> getFolder(String id);
  Future<Result<DocumentFolder>> createFolder(Map<String, dynamic> payload);
  Future<Result<DocumentFolder>> updateFolder(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteFolder(String id);

  Future<Result<Cacheable<Paginated<Document>>>> listDocuments(ListQuery query);
  Future<Result<Document>> getDocument(String id);
  Future<Result<Document>> createDocument(Map<String, dynamic> payload);
  Future<Result<Document>> updateDocument(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteDocument(String id);
  Future<Result<Document>> starDocument(String id);
  Future<Result<Document>> approveDocument(String id);
  Future<Result<Document>> signDocument(String id);

  Future<Result<Cacheable<Paginated<DocumentVersion>>>> listDocumentVersions(String documentId, ListQuery query);

  Future<Result<Cacheable<Paginated<DocumentTemplate>>>> listTemplates(ListQuery query);
  Future<Result<DocumentTemplate>> getTemplate(String id);
  Future<Result<DocumentTemplate>> createTemplate(Map<String, dynamic> payload);
  Future<Result<void>> deleteTemplate(String id);
}
