import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/saved_views.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class SavedViewsRepository {
  Future<Result<Cacheable<Paginated<SavedView>>>> listSavedViews(ListQuery query);
  Future<Result<SavedView>> getSavedView(String id);
  Future<Result<SavedView>> createSavedView(Map<String, dynamic> payload);
  Future<Result<SavedView>> updateSavedView(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteSavedView(String id);

  Future<Result<Cacheable<Paginated<SavedViewShare>>>> listShares(ListQuery query);
  Future<Result<SavedViewShare>> createShare(Map<String, dynamic> payload);
  Future<Result<void>> deleteShare(String id);
}
