import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/search.dart';
import '../repositories/search_repository.dart';

class SearchQueryUseCase extends UseCase<Cacheable<Paginated<SearchResult>>, ListQuery> {
  const SearchQueryUseCase(this._repository);
  final SearchRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SearchResult>>>> call(ListQuery params) =>
      _repository.search(params);
}

class ListSearchIndexConfigsUseCase extends UseCase<Cacheable<Paginated<SearchIndexConfig>>, ListQuery> {
  const ListSearchIndexConfigsUseCase(this._repository);
  final SearchRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SearchIndexConfig>>>> call(ListQuery params) =>
      _repository.listIndexConfigs(params);
}

class UpdateSearchIndexConfigUseCase extends UseCase<SearchIndexConfig, (String, Map<String, dynamic>)> {
  const UpdateSearchIndexConfigUseCase(this._repository);
  final SearchRepository _repository;
  @override
  Future<Result<SearchIndexConfig>> call((String, Map<String, dynamic>) params) =>
      _repository.updateIndexConfig(params.$1, params.$2);
}

class ListSearchSynonymsUseCase extends UseCase<Cacheable<Paginated<SearchSynonymGroup>>, ListQuery> {
  const ListSearchSynonymsUseCase(this._repository);
  final SearchRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SearchSynonymGroup>>>> call(ListQuery params) =>
      _repository.listSynonyms(params);
}

class SaveSearchSynonymParams {
  const SaveSearchSynonymParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveSearchSynonymUseCase extends UseCase<SearchSynonymGroup, SaveSearchSynonymParams> {
  const SaveSearchSynonymUseCase(this._repository);
  final SearchRepository _repository;
  @override
  Future<Result<SearchSynonymGroup>> call(SaveSearchSynonymParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createSynonym(params.payload)
        : _repository.updateSynonym(id, params.payload);
  }
}

class DeleteSearchSynonymUseCase extends UseCase<void, String> {
  const DeleteSearchSynonymUseCase(this._repository);
  final SearchRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteSynonym(id);
}
