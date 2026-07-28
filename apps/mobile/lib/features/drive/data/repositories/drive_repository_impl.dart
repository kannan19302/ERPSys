import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/drive.dart';
import '../../domain/repositories/drive_repository.dart';
import '../datasources/drive_remote_data_source.dart';
import '../models/drive_models.dart';

class DriveRepositoryImpl implements DriveRepository {
  const DriveRepositoryImpl({
    required DriveRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _fileNamespace = 'drive.files';
  static const String _folderNamespace = 'drive.folders';
  static const String _trashNamespace = 'drive.trash';
  static const String _tagNamespace = 'drive.tags';

  final DriveRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<DriveFile>>>> listFiles(ListQuery q) =>
      _paginated(_fileNamespace, q, () => _remote.listFiles(q),
        DriveFileModel.fromJson);

  @override
  Future<Result<DriveFile>> getFile(String id) =>
      _single(() => _remote.getFile(id));

  @override
  Future<Result<DriveFile>> createFile(Map<String, dynamic> p) =>
      _write(() => _remote.createFile(p));

  @override
  Future<Result<DriveFile>> updateFile(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateFile(id, p));

  @override
  Future<Result<void>> deleteFile(String id) =>
      _delete(() => _remote.deleteFile(id));

  @override
  Future<Result<DriveFile>> starFile(String id) =>
      _single(() => _remote.starFile(id));

  @override
  Future<Result<DriveFile>> restoreFile(String id) =>
      _single(() => _remote.restoreFile(id));

  @override
  Future<Result<Cacheable<Paginated<DriveFolder>>>> listFolders(ListQuery q) =>
      _paginated(_folderNamespace, q, () => _remote.listFolders(q),
        DriveFolderModel.fromJson);

  @override
  Future<Result<DriveFolder>> getFolder(String id) =>
      _single(() => _remote.getFolder(id));

  @override
  Future<Result<DriveFolder>> createFolder(Map<String, dynamic> p) =>
      _write(() => _remote.createFolder(p));

  @override
  Future<Result<DriveFolder>> updateFolder(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateFolder(id, p));

  @override
  Future<Result<void>> deleteFolder(String id) =>
      _delete(() => _remote.deleteFolder(id));

  @override
  Future<Result<Cacheable<Paginated<DriveTrashItem>>>> listTrash(ListQuery q) =>
      _paginated(_trashNamespace, q, () => _remote.listTrash(q),
        DriveTrashItemModel.fromJson);

  @override
  Future<Result<void>> restoreTrashItem(String id) =>
      _single(() => _remote.restoreTrashItem(id));

  @override
  Future<Result<void>> emptyTrash() =>
      _delete(() => _remote.emptyTrash());

  @override
  Future<Result<Cacheable<Paginated<DriveTag>>>> listTags(ListQuery q) =>
      _paginated(_tagNamespace, q, () => _remote.listTags(q),
        DriveTagModel.fromJson);

  @override
  Future<Result<DriveTag>> createTag(Map<String, dynamic> p) =>
      _write(() => _remote.createTag(p));

  @override
  Future<Result<DriveTag>> updateTag(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateTag(id, p));

  @override
  Future<Result<void>> deleteTag(String id) =>
      _delete(() => _remote.deleteTag(id));
}
