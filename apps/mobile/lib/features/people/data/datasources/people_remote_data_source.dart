import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/people_models.dart';

abstract class PeopleRemoteDataSource {
  Future<Paginated<PersonModel>> listPeople(ListQuery query);
  Future<PersonModel> getPerson(String id);
  Future<PersonModel> createPerson(Map<String, dynamic> payload);
  Future<PersonModel> updatePerson(String id, Map<String, dynamic> payload);
  Future<void> deletePerson(String id);

  Future<Paginated<PeopleTeamModel>> listTeams(ListQuery query);
  Future<PeopleTeamModel> getTeam(String id);
  Future<PeopleTeamModel> createTeam(Map<String, dynamic> payload);
  Future<PeopleTeamModel> updateTeam(String id, Map<String, dynamic> payload);
  Future<void> deleteTeam(String id);

  Future<Paginated<PeopleOnboardingTaskModel>> listOnboardingTasks(ListQuery query);
  Future<PeopleOnboardingTaskModel> getOnboardingTask(String id);
  Future<PeopleOnboardingTaskModel> createOnboardingTask(Map<String, dynamic> payload);
  Future<PeopleOnboardingTaskModel> updateOnboardingTask(String id, Map<String, dynamic> payload);
  Future<void> deleteOnboardingTask(String id);
  Future<PeopleOnboardingTaskModel> completeOnboardingTask(String id);

  Future<Paginated<PeopleRecognitionEntryModel>> listRecognitionEntries(ListQuery query);
  Future<PeopleRecognitionEntryModel> createRecognitionEntry(Map<String, dynamic> payload);
  Future<void> deleteRecognitionEntry(String id);
}

class PeopleRemoteDataSourceImpl implements PeopleRemoteDataSource {
  const PeopleRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<PersonModel>> listPeople(ListQuery query) =>
      _client.getPaginated<PersonModel>(
        ApiPaths.peopleDirectory, query, PersonModel.fromJson,);

  @override
  Future<PersonModel> getPerson(String id) async =>
      PersonModel.fromJson(await _client.getObject(ApiPaths.person(id)));

  @override
  Future<PersonModel> createPerson(Map<String, dynamic> payload) async =>
      PersonModel.fromJson(await _client.post(ApiPaths.peopleDirectory, body: payload));

  @override
  Future<PersonModel> updatePerson(String id, Map<String, dynamic> payload) async =>
      PersonModel.fromJson(await _client.patch(ApiPaths.person(id), body: payload));

  @override
  Future<void> deletePerson(String id) =>
      _client.delete(ApiPaths.person(id));

  @override
  Future<Paginated<PeopleTeamModel>> listTeams(ListQuery query) =>
      _client.getPaginated<PeopleTeamModel>(ApiPaths.peopleTeams, query, PeopleTeamModel.fromJson);

  @override
  Future<PeopleTeamModel> getTeam(String id) async =>
      PeopleTeamModel.fromJson(await _client.getObject(ApiPaths.peopleTeam(id)));

  @override
  Future<PeopleTeamModel> createTeam(Map<String, dynamic> payload) async =>
      PeopleTeamModel.fromJson(await _client.post(ApiPaths.peopleTeams, body: payload));

  @override
  Future<PeopleTeamModel> updateTeam(String id, Map<String, dynamic> payload) async =>
      PeopleTeamModel.fromJson(await _client.patch(ApiPaths.peopleTeam(id), body: payload));

  @override
  Future<void> deleteTeam(String id) =>
      _client.delete(ApiPaths.peopleTeam(id));

  @override
  Future<Paginated<PeopleOnboardingTaskModel>> listOnboardingTasks(ListQuery query) =>
      _client.getPaginated<PeopleOnboardingTaskModel>(
        ApiPaths.peopleOnboardingTasks, query, PeopleOnboardingTaskModel.fromJson,);

  @override
  Future<PeopleOnboardingTaskModel> getOnboardingTask(String id) async =>
      PeopleOnboardingTaskModel.fromJson(
        await _client.getObject(ApiPaths.peopleOnboardingTask(id)),);

  @override
  Future<PeopleOnboardingTaskModel> createOnboardingTask(
    Map<String, dynamic> payload,) async =>
      PeopleOnboardingTaskModel.fromJson(
        await _client.post(ApiPaths.peopleOnboardingTasks, body: payload),);

  @override
  Future<PeopleOnboardingTaskModel> updateOnboardingTask(
    String id, Map<String, dynamic> payload,) async =>
      PeopleOnboardingTaskModel.fromJson(
        await _client.patch(ApiPaths.peopleOnboardingTask(id), body: payload),);

  @override
  Future<void> deleteOnboardingTask(String id) =>
      _client.delete(ApiPaths.peopleOnboardingTask(id));

  @override
  Future<PeopleOnboardingTaskModel> completeOnboardingTask(String id) async =>
      PeopleOnboardingTaskModel.fromJson(
        await _client.post('${ApiPaths.peopleOnboardingTask(id)}/complete'),);

  @override
  Future<Paginated<PeopleRecognitionEntryModel>> listRecognitionEntries(ListQuery query) =>
      _client.getPaginated<PeopleRecognitionEntryModel>(
        ApiPaths.peopleRecognition, query, PeopleRecognitionEntryModel.fromJson,);

  @override
  Future<PeopleRecognitionEntryModel> createRecognitionEntry(
    Map<String, dynamic> payload,) async =>
      PeopleRecognitionEntryModel.fromJson(
        await _client.post(ApiPaths.peopleRecognition, body: payload),);

  @override
  Future<void> deleteRecognitionEntry(String id) =>
      _client.delete(ApiPaths.peopleRecognitionEntry(id));
}
