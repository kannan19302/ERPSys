import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/drive.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class DriveRepository {
  Future<Result<Cacheable<Paginated<DriveFile>>>> listFiles(ListQuery query);
  Future<Result<DriveFile>> getFile(String id);
  Future<Result<DriveFile>> createFile(Map<String, dynamic> payload);
  Future<Result<DriveFile>> updateFile(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteFile(String id);
  Future<Result<DriveFile>> starFile(String id);
  Future<Result<DriveFile>> restoreFile(String id);

  Future<Result<Cacheable<Paginated<DriveFolder>>>> listFolders(ListQuery query);
  Future<Result<DriveFolder>> getFolder(String id);
  Future<Result<DriveFolder>> createFolder(Map<String, dynamic> payload);
  Future<Result<DriveFolder>> updateFolder(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteFolder(String id);

  Future<Result<Cacheable<Paginated<DriveTrashItem>>>> listTrash(ListQuery query);
  Future<Result<void>> restoreTrashItem(String id);
  Future<Result<void>> emptyTrash();

  Future<Result<Cacheable<Paginated<DriveTag>>>> listTags(ListQuery query);
  Future<Result<DriveTag>> createTag(Map<String, dynamic> payload);
  Future<Result<DriveTag>> updateTag(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteTag(String id);
}
