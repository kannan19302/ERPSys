import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/onboarding_checklist.dart';
import '../repositories/onboarding_repository.dart';

class GetOnboardingStateUseCase extends UseCase<OnboardingChecklist, NoParams> {
  const GetOnboardingStateUseCase(this._repository);

  final OnboardingRepository _repository;

  @override
  Future<Result<OnboardingChecklist>> call(NoParams params) =>
      _repository.getState();
}

class CompleteOnboardingStepUseCase extends UseCase<OnboardingChecklist, String> {
  const CompleteOnboardingStepUseCase(this._repository);

  final OnboardingRepository _repository;

  @override
  Future<Result<OnboardingChecklist>> call(String key) =>
      _repository.completeStep(key);
}
