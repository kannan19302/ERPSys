import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/localization.dart';
import '../repositories/localization_repository.dart';

class ListTranslationsUseCase extends UseCase<Cacheable<Paginated<LocalizationTranslation>>, ListQuery> {
  const ListTranslationsUseCase(this._repository);
  final LocalizationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<LocalizationTranslation>>>> call(ListQuery params) =>
      _repository.listTranslations(params);
}

class SaveTranslationParams {
  const SaveTranslationParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveTranslationUseCase extends UseCase<LocalizationTranslation, SaveTranslationParams> {
  const SaveTranslationUseCase(this._repository);
  final LocalizationRepository _repository;
  @override
  Future<Result<LocalizationTranslation>> call(SaveTranslationParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createTranslation(params.payload)
        : _repository.updateTranslation(id, params.payload);
  }
}

class DeleteTranslationUseCase extends UseCase<void, String> {
  const DeleteTranslationUseCase(this._repository);
  final LocalizationRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteTranslation(id);
}

class ListLanguagesUseCase extends UseCase<Cacheable<Paginated<LocalizationLanguage>>, ListQuery> {
  const ListLanguagesUseCase(this._repository);
  final LocalizationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<LocalizationLanguage>>>> call(ListQuery params) =>
      _repository.listLanguages(params);
}

class SaveLanguageParams {
  const SaveLanguageParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveLanguageUseCase extends UseCase<LocalizationLanguage, SaveLanguageParams> {
  const SaveLanguageUseCase(this._repository);
  final LocalizationRepository _repository;
  @override
  Future<Result<LocalizationLanguage>> call(SaveLanguageParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createLanguage(params.payload)
        : _repository.updateLanguage(id, params.payload);
  }
}

class DeleteLanguageUseCase extends UseCase<void, String> {
  const DeleteLanguageUseCase(this._repository);
  final LocalizationRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteLanguage(id);
}

class ListRegionsUseCase extends UseCase<Cacheable<Paginated<LocalizationRegion>>, ListQuery> {
  const ListRegionsUseCase(this._repository);
  final LocalizationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<LocalizationRegion>>>> call(ListQuery params) =>
      _repository.listRegions(params);
}

class SaveRegionParams {
  const SaveRegionParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveRegionUseCase extends UseCase<LocalizationRegion, SaveRegionParams> {
  const SaveRegionUseCase(this._repository);
  final LocalizationRepository _repository;
  @override
  Future<Result<LocalizationRegion>> call(SaveRegionParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createRegion(params.payload)
        : _repository.updateRegion(id, params.payload);
  }
}

class DeleteRegionUseCase extends UseCase<void, String> {
  const DeleteRegionUseCase(this._repository);
  final LocalizationRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteRegion(id);
}
