import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/search.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class SearchRepository {
  Future<Result<Cacheable<Paginated<SearchResult>>>> search(ListQuery query);
  Future<Result<Cacheable<Paginated<SearchIndexConfig>>>> listIndexConfigs(ListQuery query);
  Future<Result<SearchIndexConfig>> updateIndexConfig(String id, Map<String, dynamic> payload);
  Future<Result<Cacheable<Paginated<SearchSynonymGroup>>>> listSynonyms(ListQuery query);
  Future<Result<SearchSynonymGroup>> createSynonym(Map<String, dynamic> payload);
  Future<Result<SearchSynonymGroup>> updateSynonym(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteSynonym(String id);
}
