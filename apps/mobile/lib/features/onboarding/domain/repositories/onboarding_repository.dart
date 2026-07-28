import '../../../../core/usecase/result.dart';
import '../entities/onboarding_checklist.dart';

abstract class OnboardingRepository {
  /// `GET /auth/onboarding`.
  Future<Result<OnboardingChecklist>> getState();

  /// `PUT /auth/onboarding/complete/:key`. Only `dashboard` is accepted by
  /// the API — every other key is derived server-side and rejected with a
  /// validation error if attempted.
  Future<Result<OnboardingChecklist>> completeStep(String key);
}
