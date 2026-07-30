import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/drive.dart';
import '../repositories/drive_repository.dart';

class ListDriveFilesUseCase extends UseCase<Cacheable<Paginated<DriveFile>>, ListQuery> {
  const ListDriveFilesUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<DriveFile>>>> call(ListQuery params) =>
      _repository.listFiles(params);
}

class SaveDriveFileParams {
  const SaveDriveFileParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveDriveFileUseCase extends UseCase<DriveFile, SaveDriveFileParams> {
  const SaveDriveFileUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<DriveFile>> call(SaveDriveFileParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createFile(params.payload)
        : _repository.updateFile(id, params.payload);
  }
}

class DeleteDriveFileUseCase extends UseCase<void, String> {
  const DeleteDriveFileUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteFile(id);
}

class StarDriveFileUseCase extends UseCase<DriveFile, String> {
  const StarDriveFileUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<DriveFile>> call(String id) => _repository.starFile(id);
}

class RestoreDriveFileUseCase extends UseCase<DriveFile, String> {
  const RestoreDriveFileUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<DriveFile>> call(String id) => _repository.restoreFile(id);
}

class ListDriveFoldersUseCase extends UseCase<Cacheable<Paginated<DriveFolder>>, ListQuery> {
  const ListDriveFoldersUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<DriveFolder>>>> call(ListQuery params) =>
      _repository.listFolders(params);
}

class SaveDriveFolderParams {
  const SaveDriveFolderParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveDriveFolderUseCase extends UseCase<DriveFolder, SaveDriveFolderParams> {
  const SaveDriveFolderUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<DriveFolder>> call(SaveDriveFolderParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createFolder(params.payload)
        : _repository.updateFolder(id, params.payload);
  }
}

class DeleteDriveFolderUseCase extends UseCase<void, String> {
  const DeleteDriveFolderUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteFolder(id);
}

class ListDriveTrashUseCase extends UseCase<Cacheable<Paginated<DriveTrashItem>>, ListQuery> {
  const ListDriveTrashUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<DriveTrashItem>>>> call(ListQuery params) =>
      _repository.listTrash(params);
}

class RestoreDriveTrashItemUseCase extends UseCase<void, String> {
  const RestoreDriveTrashItemUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.restoreTrashItem(id);
}

class EmptyDriveTrashUseCase extends UseCase<void, NoParams> {
  const EmptyDriveTrashUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<void>> call(NoParams params) => _repository.emptyTrash();
}

class ListDriveTagsUseCase extends UseCase<Cacheable<Paginated<DriveTag>>, ListQuery> {
  const ListDriveTagsUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<DriveTag>>>> call(ListQuery params) =>
      _repository.listTags(params);
}

class SaveDriveTagParams {
  const SaveDriveTagParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveDriveTagUseCase extends UseCase<DriveTag, SaveDriveTagParams> {
  const SaveDriveTagUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<DriveTag>> call(SaveDriveTagParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createTag(params.payload)
        : _repository.updateTag(id, params.payload);
  }
}

class DeleteDriveTagUseCase extends UseCase<void, String> {
  const DeleteDriveTagUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteTag(id);
}

class GetDriveFileUseCase extends UseCase<DriveFile, String> {
  const GetDriveFileUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<DriveFile>> call(String id) => _repository.getFile(id);
}

class GetDriveFolderUseCase extends UseCase<DriveFolder, String> {
  const GetDriveFolderUseCase(this._repository);
  final DriveRepository _repository;
  @override
  Future<Result<DriveFolder>> call(String id) => _repository.getFolder(id);
}
