import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/documents_models.dart';

abstract class DocumentsRemoteDataSource {
  Future<Paginated<DocumentFolderModel>> listFolders(ListQuery query);
  Future<DocumentFolderModel> getFolder(String id);
  Future<DocumentFolderModel> createFolder(Map<String, dynamic> payload);
  Future<DocumentFolderModel> updateFolder(String id, Map<String, dynamic> payload);
  Future<void> deleteFolder(String id);

  Future<Paginated<DocumentModel>> listDocuments(ListQuery query);
  Future<DocumentModel> getDocument(String id);
  Future<DocumentModel> createDocument(Map<String, dynamic> payload);
  Future<DocumentModel> updateDocument(String id, Map<String, dynamic> payload);
  Future<void> deleteDocument(String id);
  Future<DocumentModel> starDocument(String id);
  Future<DocumentModel> approveDocument(String id);
  Future<DocumentModel> signDocument(String id);

  Future<Paginated<DocumentVersionModel>> listDocumentVersions(String documentId, ListQuery query);
  Future<DocumentVersionModel> getDocumentVersion(String documentId, String versionId);

  Future<Paginated<DocumentTemplateModel>> listTemplates(ListQuery query);
  Future<DocumentTemplateModel> getTemplate(String id);
  Future<DocumentTemplateModel> createTemplate(Map<String, dynamic> payload);
  Future<void> deleteTemplate(String id);
}

class DocumentsRemoteDataSourceImpl implements DocumentsRemoteDataSource {
  const DocumentsRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<DocumentFolderModel>> listFolders(ListQuery query) =>
      _client.getPaginated<DocumentFolderModel>(
        ApiPaths.folders, query, DocumentFolderModel.fromJson,);

  @override
  Future<DocumentFolderModel> getFolder(String id) async =>
      DocumentFolderModel.fromJson(
        await _client.getObject(ApiPaths.folder(id)),);

  @override
  Future<DocumentFolderModel> createFolder(Map<String, dynamic> payload) async =>
      DocumentFolderModel.fromJson(
        await _client.post(ApiPaths.folders, body: payload),);

  @override
  Future<DocumentFolderModel> updateFolder(
    String id, Map<String, dynamic> payload,) async =>
      DocumentFolderModel.fromJson(
        await _client.patch(ApiPaths.folder(id), body: payload),);

  @override
  Future<void> deleteFolder(String id) =>
      _client.delete(ApiPaths.folder(id));

  @override
  Future<Paginated<DocumentModel>> listDocuments(ListQuery query) =>
      _client.getPaginated<DocumentModel>(
        ApiPaths.documents, query, DocumentModel.fromJson,);

  @override
  Future<DocumentModel> getDocument(String id) async =>
      DocumentModel.fromJson(
        await _client.getObject(ApiPaths.document(id)),);

  @override
  Future<DocumentModel> createDocument(Map<String, dynamic> payload) async =>
      DocumentModel.fromJson(
        await _client.post(ApiPaths.documents, body: payload),);

  @override
  Future<DocumentModel> updateDocument(
    String id, Map<String, dynamic> payload,) async =>
      DocumentModel.fromJson(
        await _client.patch(ApiPaths.document(id), body: payload),);

  @override
  Future<void> deleteDocument(String id) =>
      _client.delete(ApiPaths.document(id));

  @override
  Future<DocumentModel> starDocument(String id) async =>
      DocumentModel.fromJson(
        await _client.post(ApiPaths.documentStar(id)),);

  @override
  Future<DocumentModel> approveDocument(String id) async =>
      DocumentModel.fromJson(
        await _client.post(ApiPaths.documentApprove(id)),);

  @override
  Future<DocumentModel> signDocument(String id) async =>
      DocumentModel.fromJson(
        await _client.post(ApiPaths.documentSign(id)),);

  @override
  Future<Paginated<DocumentVersionModel>> listDocumentVersions(
    String documentId, ListQuery query,) =>
      _client.getPaginated<DocumentVersionModel>(
        ApiPaths.documentVersions(documentId), query, DocumentVersionModel.fromJson,);

  @override
  Future<DocumentVersionModel> getDocumentVersion(
    String documentId, String versionId,) async =>
      DocumentVersionModel.fromJson(
        await _client.getObject(
          '${ApiPaths.documentVersions(documentId)}/$versionId',),);

  @override
  Future<Paginated<DocumentTemplateModel>> listTemplates(ListQuery query) =>
      _client.getPaginated<DocumentTemplateModel>(
        ApiPaths.documentTemplates, query, DocumentTemplateModel.fromJson,);

  @override
  Future<DocumentTemplateModel> getTemplate(String id) async =>
      DocumentTemplateModel.fromJson(
        await _client.getObject('/documents/templates/$id'),);

  @override
  Future<DocumentTemplateModel> createTemplate(Map<String, dynamic> payload) async =>
      DocumentTemplateModel.fromJson(
        await _client.post(ApiPaths.documentTemplates, body: payload),);

  @override
  Future<void> deleteTemplate(String id) =>
      _client.delete('/documents/templates/$id');
}
