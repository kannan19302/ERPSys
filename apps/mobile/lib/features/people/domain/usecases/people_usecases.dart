import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/people.dart';
import '../repositories/people_repository.dart';

class ListPeopleUseCase extends UseCase<Cacheable<Paginated<Person>>, ListQuery> {
  const ListPeopleUseCase(this._repository);
  final PeopleRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Person>>>> call(ListQuery params) =>
      _repository.listPeople(params);
}

class GetPersonUseCase extends UseCase<Person, String> {
  const GetPersonUseCase(this._repository);
  final PeopleRepository _repository;
  @override
  Future<Result<Person>> call(String id) => _repository.getPerson(id);
}

class SavePersonParams {
  const SavePersonParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SavePersonUseCase extends UseCase<Person, SavePersonParams> {
  const SavePersonUseCase(this._repository);
  final PeopleRepository _repository;
  @override
  Future<Result<Person>> call(SavePersonParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPerson(params.payload)
        : _repository.updatePerson(id, params.payload);
  }
}

class DeletePersonUseCase extends UseCase<void, String> {
  const DeletePersonUseCase(this._repository);
  final PeopleRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deletePerson(id);
}

class ListTeamsUseCase extends UseCase<Cacheable<Paginated<PeopleTeam>>, ListQuery> {
  const ListTeamsUseCase(this._repository);
  final PeopleRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PeopleTeam>>>> call(ListQuery params) =>
      _repository.listTeams(params);
}

class ListOnboardingTasksUseCase
    extends UseCase<Cacheable<Paginated<PeopleOnboardingTask>>, ListQuery> {
  const ListOnboardingTasksUseCase(this._repository);
  final PeopleRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PeopleOnboardingTask>>>> call(ListQuery params) =>
      _repository.listOnboardingTasks(params);
}

class ListRecognitionEntriesUseCase
    extends UseCase<Cacheable<Paginated<PeopleRecognitionEntry>>, ListQuery> {
  const ListRecognitionEntriesUseCase(this._repository);
  final PeopleRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PeopleRecognitionEntry>>>> call(ListQuery params) =>
      _repository.listRecognitionEntries(params);
}
