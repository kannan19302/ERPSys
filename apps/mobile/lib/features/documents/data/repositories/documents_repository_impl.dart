import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/documents.dart';
import '../../domain/repositories/documents_repository.dart';
import '../datasources/documents_remote_data_source.dart';
import '../models/documents_models.dart';

class DocumentsRepositoryImpl implements DocumentsRepository {
  const DocumentsRepositoryImpl({
    required DocumentsRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _foldersNamespace = 'documents.folders';
  static const String _documentsNamespace = 'documents.documents';
  static const String _versionsNamespace = 'documents.versions';
  static const String _templatesNamespace = 'documents.templates';

  final DocumentsRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<DocumentFolder>>>> listFolders(ListQuery q) =>
      _paginated(_foldersNamespace, q, () => _remote.listFolders(q),
        DocumentFolderModel.fromJson,);

  @override
  Future<Result<DocumentFolder>> getFolder(String id) =>
      _single(() => _remote.getFolder(id));

  @override
  Future<Result<DocumentFolder>> createFolder(Map<String, dynamic> p) =>
      _write(() => _remote.createFolder(p));

  @override
  Future<Result<DocumentFolder>> updateFolder(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateFolder(id, p));

  @override
  Future<Result<void>> deleteFolder(String id) =>
      _delete(() => _remote.deleteFolder(id));

  @override
  Future<Result<Cacheable<Paginated<Document>>>> listDocuments(ListQuery q) =>
      _paginated(_documentsNamespace, q, () => _remote.listDocuments(q),
        DocumentModel.fromJson,);

  @override
  Future<Result<Document>> getDocument(String id) =>
      _single(() => _remote.getDocument(id));

  @override
  Future<Result<Document>> createDocument(Map<String, dynamic> p) =>
      _write(() => _remote.createDocument(p));

  @override
  Future<Result<Document>> updateDocument(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateDocument(id, p));

  @override
  Future<Result<void>> deleteDocument(String id) =>
      _delete(() => _remote.deleteDocument(id));

  @override
  Future<Result<Document>> starDocument(String id) =>
      _single(() => _remote.starDocument(id));

  @override
  Future<Result<Document>> approveDocument(String id) =>
      _single(() => _remote.approveDocument(id));

  @override
  Future<Result<Document>> signDocument(String id) =>
      _single(() => _remote.signDocument(id));

  @override
  Future<Result<Cacheable<Paginated<DocumentVersion>>>> listDocumentVersions(
    String documentId, ListQuery q,) =>
      _paginated(_versionsNamespace, q,
        () => _remote.listDocumentVersions(documentId, q),
        DocumentVersionModel.fromJson,);

  @override
  Future<Result<Cacheable<Paginated<DocumentTemplate>>>> listTemplates(ListQuery q) =>
      _paginated(_templatesNamespace, q, () => _remote.listTemplates(q),
        DocumentTemplateModel.fromJson,);

  @override
  Future<Result<DocumentTemplate>> getTemplate(String id) =>
      _single(() => _remote.getTemplate(id));

  @override
  Future<Result<DocumentTemplate>> createTemplate(Map<String, dynamic> p) =>
      _write(() => _remote.createTemplate(p));

  @override
  Future<Result<void>> deleteTemplate(String id) =>
      _delete(() => _remote.deleteTemplate(id));
}
