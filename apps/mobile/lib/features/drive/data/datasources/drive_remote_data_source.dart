import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/drive_models.dart';

abstract class DriveRemoteDataSource {
  Future<Paginated<DriveFileModel>> listFiles(ListQuery query);
  Future<DriveFileModel> getFile(String id);
  Future<DriveFileModel> createFile(Map<String, dynamic> payload);
  Future<DriveFileModel> updateFile(String id, Map<String, dynamic> payload);
  Future<void> deleteFile(String id);
  Future<DriveFileModel> starFile(String id);
  Future<DriveFileModel> restoreFile(String id);

  Future<Paginated<DriveFolderModel>> listFolders(ListQuery query);
  Future<DriveFolderModel> getFolder(String id);
  Future<DriveFolderModel> createFolder(Map<String, dynamic> payload);
  Future<DriveFolderModel> updateFolder(String id, Map<String, dynamic> payload);
  Future<void> deleteFolder(String id);

  Future<Paginated<DriveTrashItemModel>> listTrash(ListQuery query);
  Future<void> restoreTrashItem(String id);
  Future<void> emptyTrash();

  Future<Paginated<DriveTagModel>> listTags(ListQuery query);
  Future<DriveTagModel> createTag(Map<String, dynamic> payload);
  Future<DriveTagModel> updateTag(String id, Map<String, dynamic> payload);
  Future<void> deleteTag(String id);
}

class DriveRemoteDataSourceImpl implements DriveRemoteDataSource {
  const DriveRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<DriveFileModel>> listFiles(ListQuery query) =>
      _client.getPaginated<DriveFileModel>(
        ApiPaths.driveFiles, query, DriveFileModel.fromJson);

  @override
  Future<DriveFileModel> getFile(String id) async =>
      DriveFileModel.fromJson(
        await _client.getObject(ApiPaths.driveFile(id)));

  @override
  Future<DriveFileModel> createFile(Map<String, dynamic> payload) async =>
      DriveFileModel.fromJson(
        await _client.post(ApiPaths.driveFiles, body: payload));

  @override
  Future<DriveFileModel> updateFile(String id, Map<String, dynamic> payload) async =>
      DriveFileModel.fromJson(
        await _client.patch(ApiPaths.driveFile(id), body: payload));

  @override
  Future<void> deleteFile(String id) =>
      _client.delete(ApiPaths.driveFile(id));

  @override
  Future<DriveFileModel> starFile(String id) async =>
      DriveFileModel.fromJson(
        await _client.post('${ApiPaths.driveFile(id)}/star'));

  @override
  Future<DriveFileModel> restoreFile(String id) async =>
      DriveFileModel.fromJson(
        await _client.post(ApiPaths.driveTrashRestore(id)));

  @override
  Future<Paginated<DriveFolderModel>> listFolders(ListQuery query) =>
      _client.getPaginated<DriveFolderModel>(
        ApiPaths.driveFolders, query, DriveFolderModel.fromJson);

  @override
  Future<DriveFolderModel> getFolder(String id) async =>
      DriveFolderModel.fromJson(
        await _client.getObject(ApiPaths.driveFolder(id)));

  @override
  Future<DriveFolderModel> createFolder(Map<String, dynamic> payload) async =>
      DriveFolderModel.fromJson(
        await _client.post(ApiPaths.driveFolders, body: payload));

  @override
  Future<DriveFolderModel> updateFolder(String id, Map<String, dynamic> payload) async =>
      DriveFolderModel.fromJson(
        await _client.patch(ApiPaths.driveFolder(id), body: payload));

  @override
  Future<void> deleteFolder(String id) =>
      _client.delete(ApiPaths.driveFolder(id));

  @override
  Future<Paginated<DriveTrashItemModel>> listTrash(ListQuery query) =>
      _client.getPaginated<DriveTrashItemModel>(
        ApiPaths.driveTrash, query, DriveTrashItemModel.fromJson);

  @override
  Future<void> restoreTrashItem(String id) =>
      _client.post(ApiPaths.driveTrashRestore(id));

  @override
  Future<void> emptyTrash() =>
      _client.delete(ApiPaths.driveTrash);

  @override
  Future<Paginated<DriveTagModel>> listTags(ListQuery query) =>
      _client.getPaginated<DriveTagModel>(
        ApiPaths.driveTags, query, DriveTagModel.fromJson);

  @override
  Future<DriveTagModel> createTag(Map<String, dynamic> payload) async =>
      DriveTagModel.fromJson(
        await _client.post(ApiPaths.driveTags, body: payload));

  @override
  Future<DriveTagModel> updateTag(String id, Map<String, dynamic> payload) async =>
      DriveTagModel.fromJson(
        await _client.patch(ApiPaths.driveTag(id), body: payload));

  @override
  Future<void> deleteTag(String id) =>
      _client.delete(ApiPaths.driveTag(id));
}
