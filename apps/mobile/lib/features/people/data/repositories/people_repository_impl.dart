import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/people.dart';
import '../../domain/repositories/people_repository.dart';
import '../datasources/people_remote_data_source.dart';
import '../models/people_models.dart';

class PeopleRepositoryImpl implements PeopleRepository {
  const PeopleRepositoryImpl({
    required PeopleRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _personNamespace = 'people.directory';
  static const String _teamNamespace = 'people.teams';
  static const String _taskNamespace = 'people.onboarding-tasks';
  static const String _recognitionNamespace = 'people.recognition';

  final PeopleRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<Person>>>> listPeople(ListQuery query) =>
      _paginated(_personNamespace, query, () => _remote.listPeople(query),
        PersonModel.fromJson);

  @override
  Future<Result<Person>> getPerson(String id) =>
      _single(() => _remote.getPerson(id));

  @override
  Future<Result<Person>> createPerson(Map<String, dynamic> p) =>
      _write(() => _remote.createPerson(p));

  @override
  Future<Result<Person>> updatePerson(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updatePerson(id, p));

  @override
  Future<Result<void>> deletePerson(String id) =>
      _delete(() => _remote.deletePerson(id));

  @override
  Future<Result<Cacheable<Paginated<PeopleTeam>>>> listTeams(ListQuery query) =>
      _paginated(_teamNamespace, query, () => _remote.listTeams(query),
        PeopleTeamModel.fromJson);

  @override
  Future<Result<PeopleTeam>> getTeam(String id) =>
      _single(() => _remote.getTeam(id));

  @override
  Future<Result<PeopleTeam>> createTeam(Map<String, dynamic> p) =>
      _write(() => _remote.createTeam(p));

  @override
  Future<Result<PeopleTeam>> updateTeam(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateTeam(id, p));

  @override
  Future<Result<void>> deleteTeam(String id) =>
      _delete(() => _remote.deleteTeam(id));

  @override
  Future<Result<Cacheable<Paginated<PeopleOnboardingTask>>>> listOnboardingTasks(
    ListQuery query) =>
      _paginated(_taskNamespace, query,
        () => _remote.listOnboardingTasks(query),
        PeopleOnboardingTaskModel.fromJson);

  @override
  Future<Result<PeopleOnboardingTask>> getOnboardingTask(String id) =>
      _single(() => _remote.getOnboardingTask(id));

  @override
  Future<Result<PeopleOnboardingTask>> createOnboardingTask(Map<String, dynamic> p) =>
      _write(() => _remote.createOnboardingTask(p));

  @override
  Future<Result<PeopleOnboardingTask>> updateOnboardingTask(
    String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateOnboardingTask(id, p));

  @override
  Future<Result<void>> deleteOnboardingTask(String id) =>
      _delete(() => _remote.deleteOnboardingTask(id));

  @override
  Future<Result<PeopleOnboardingTask>> completeOnboardingTask(String id) =>
      _single(() => _remote.completeOnboardingTask(id));

  @override
  Future<Result<Cacheable<Paginated<PeopleRecognitionEntry>>>> listRecognitionEntries(
    ListQuery query) =>
      _paginated(_recognitionNamespace, query,
        () => _remote.listRecognitionEntries(query),
        PeopleRecognitionEntryModel.fromJson);

  @override
  Future<Result<PeopleRecognitionEntry>> createRecognitionEntry(Map<String, dynamic> p) =>
      _write(() => _remote.createRecognitionEntry(p));

  @override
  Future<Result<void>> deleteRecognitionEntry(String id) =>
      _delete(() => _remote.deleteRecognitionEntry(id));
}
