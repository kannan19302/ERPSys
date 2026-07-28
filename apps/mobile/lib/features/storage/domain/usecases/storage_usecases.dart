import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/storage.dart';
import '../repositories/storage_repository.dart';

class ListBucketsUseCase extends UseCase<Cacheable<Paginated<StorageBucket>>, ListQuery> {
  const ListBucketsUseCase(this._repository);
  final StorageRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<StorageBucket>>>> call(ListQuery params) =>
      _repository.listBuckets(params);
}

class GetBucketUseCase extends UseCase<StorageBucket, String> {
  const GetBucketUseCase(this._repository);
  final StorageRepository _repository;
  @override
  Future<Result<StorageBucket>> call(String id) => _repository.getBucket(id);
}

class SaveBucketParams {
  const SaveBucketParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveBucketUseCase extends UseCase<StorageBucket, SaveBucketParams> {
  const SaveBucketUseCase(this._repository);
  final StorageRepository _repository;
  @override
  Future<Result<StorageBucket>> call(SaveBucketParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createBucket(params.payload)
        : _repository.updateBucket(id, params.payload);
  }
}

class DeleteBucketUseCase extends UseCase<void, String> {
  const DeleteBucketUseCase(this._repository);
  final StorageRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteBucket(id);
}

class ListFilesUseCase extends UseCase<Cacheable<Paginated<StorageFile>>, ListQuery> {
  const ListFilesUseCase(this._repository);
  final StorageRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<StorageFile>>>> call(ListQuery params) =>
      _repository.listFiles(params);
}

class GetFileUseCase extends UseCase<StorageFile, String> {
  const GetFileUseCase(this._repository);
  final StorageRepository _repository;
  @override
  Future<Result<StorageFile>> call(String id) => _repository.getFile(id);
}

class SaveFileParams {
  const SaveFileParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveFileUseCase extends UseCase<StorageFile, SaveFileParams> {
  const SaveFileUseCase(this._repository);
  final StorageRepository _repository;
  @override
  Future<Result<StorageFile>> call(SaveFileParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createFile(params.payload)
        : _repository.updateFile(id, params.payload);
  }
}

class DeleteFileUseCase extends UseCase<void, String> {
  const DeleteFileUseCase(this._repository);
  final StorageRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteFile(id);
}

class ListPoliciesUseCase extends UseCase<Cacheable<Paginated<StoragePolicy>>, ListQuery> {
  const ListPoliciesUseCase(this._repository);
  final StorageRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<StoragePolicy>>>> call(ListQuery params) =>
      _repository.listPolicies(params);
}

class SavePolicyParams {
  const SavePolicyParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SavePolicyUseCase extends UseCase<StoragePolicy, SavePolicyParams> {
  const SavePolicyUseCase(this._repository);
  final StorageRepository _repository;
  @override
  Future<Result<StoragePolicy>> call(SavePolicyParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPolicy(params.payload)
        : _repository.updatePolicy(id, params.payload);
  }
}

class DeletePolicyUseCase extends UseCase<void, String> {
  const DeletePolicyUseCase(this._repository);
  final StorageRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deletePolicy(id);
}
