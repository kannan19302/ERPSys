import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/onboarding_checklist_model.dart';

abstract class OnboardingRemoteDataSource {
  Future<OnboardingChecklistModel> getState();

  Future<OnboardingChecklistModel> completeStep(String key);
}

class OnboardingRemoteDataSourceImpl implements OnboardingRemoteDataSource {
  const OnboardingRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<OnboardingChecklistModel> getState() async =>
      OnboardingChecklistModel.fromJson(await _client.getObject(ApiPaths.onboarding));

  @override
  Future<OnboardingChecklistModel> completeStep(String key) async =>
      OnboardingChecklistModel.fromJson(
        await _client.put(ApiPaths.onboardingComplete(key)),
      );
}
