import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/saved_views.dart';
import '../repositories/saved_views_repository.dart';

class ListSavedViewsUseCase extends UseCase<Cacheable<Paginated<SavedView>>, ListQuery> {
  const ListSavedViewsUseCase(this._repository);
  final SavedViewsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SavedView>>>> call(ListQuery params) =>
      _repository.listSavedViews(params);
}

class GetSavedViewUseCase extends UseCase<SavedView, String> {
  const GetSavedViewUseCase(this._repository);
  final SavedViewsRepository _repository;
  @override
  Future<Result<SavedView>> call(String id) => _repository.getSavedView(id);
}

class SaveSavedViewParams {
  const SaveSavedViewParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveSavedViewUseCase extends UseCase<SavedView, SaveSavedViewParams> {
  const SaveSavedViewUseCase(this._repository);
  final SavedViewsRepository _repository;
  @override
  Future<Result<SavedView>> call(SaveSavedViewParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createSavedView(params.payload)
        : _repository.updateSavedView(id, params.payload);
  }
}

class DeleteSavedViewUseCase extends UseCase<void, String> {
  const DeleteSavedViewUseCase(this._repository);
  final SavedViewsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteSavedView(id);
}

class ListSavedViewSharesUseCase extends UseCase<Cacheable<Paginated<SavedViewShare>>, ListQuery> {
  const ListSavedViewSharesUseCase(this._repository);
  final SavedViewsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SavedViewShare>>>> call(ListQuery params) =>
      _repository.listShares(params);
}

class CreateSavedViewShareUseCase extends UseCase<SavedViewShare, Map<String, dynamic>> {
  const CreateSavedViewShareUseCase(this._repository);
  final SavedViewsRepository _repository;
  @override
  Future<Result<SavedViewShare>> call(Map<String, dynamic> payload) =>
      _repository.createShare(payload);
}

class DeleteSavedViewShareUseCase extends UseCase<void, String> {
  const DeleteSavedViewShareUseCase(this._repository);
  final SavedViewsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteShare(id);
}
