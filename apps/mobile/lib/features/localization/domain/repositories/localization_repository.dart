import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/localization.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class LocalizationRepository {
  Future<Result<Cacheable<Paginated<LocalizationTranslation>>>> listTranslations(ListQuery query);
  Future<Result<LocalizationTranslation>> createTranslation(Map<String, dynamic> payload);
  Future<Result<LocalizationTranslation>> updateTranslation(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteTranslation(String id);

  Future<Result<Cacheable<Paginated<LocalizationLanguage>>>> listLanguages(ListQuery query);
  Future<Result<LocalizationLanguage>> createLanguage(Map<String, dynamic> payload);
  Future<Result<LocalizationLanguage>> updateLanguage(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteLanguage(String id);

  Future<Result<Cacheable<Paginated<LocalizationRegion>>>> listRegions(ListQuery query);
  Future<Result<LocalizationRegion>> createRegion(Map<String, dynamic> payload);
  Future<Result<LocalizationRegion>> updateRegion(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteRegion(String id);
}
