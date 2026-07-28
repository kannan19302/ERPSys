import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/people.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class PeopleRepository {
  Future<Result<Cacheable<Paginated<Person>>>> listPeople(ListQuery query);
  Future<Result<Person>> getPerson(String id);
  Future<Result<Person>> createPerson(Map<String, dynamic> payload);
  Future<Result<Person>> updatePerson(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePerson(String id);

  Future<Result<Cacheable<Paginated<PeopleTeam>>>> listTeams(ListQuery query);
  Future<Result<PeopleTeam>> getTeam(String id);
  Future<Result<PeopleTeam>> createTeam(Map<String, dynamic> payload);
  Future<Result<PeopleTeam>> updateTeam(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteTeam(String id);

  Future<Result<Cacheable<Paginated<PeopleOnboardingTask>>>> listOnboardingTasks(
    ListQuery query);
  Future<Result<PeopleOnboardingTask>> getOnboardingTask(String id);
  Future<Result<PeopleOnboardingTask>> createOnboardingTask(Map<String, dynamic> payload);
  Future<Result<PeopleOnboardingTask>> updateOnboardingTask(
    String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteOnboardingTask(String id);
  Future<Result<PeopleOnboardingTask>> completeOnboardingTask(String id);

  Future<Result<Cacheable<Paginated<PeopleRecognitionEntry>>>> listRecognitionEntries(
    ListQuery query);
  Future<Result<PeopleRecognitionEntry>> createRecognitionEntry(Map<String, dynamic> payload);
  Future<Result<void>> deleteRecognitionEntry(String id);
}
