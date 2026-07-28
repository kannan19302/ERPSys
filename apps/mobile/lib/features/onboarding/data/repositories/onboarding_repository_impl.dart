import '../../../../core/error/error_mapper.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/onboarding_checklist.dart';
import '../../domain/repositories/onboarding_repository.dart';
import '../datasources/onboarding_remote_datasource.dart';

class OnboardingRepositoryImpl implements OnboardingRepository {
  const OnboardingRepositoryImpl(this._remote);

  final OnboardingRemoteDataSource _remote;

  @override
  Future<Result<OnboardingChecklist>> getState() async {
    try {
      return Result<OnboardingChecklist>.ok(await _remote.getState());
    } on Object catch (error) {
      return Result<OnboardingChecklist>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<OnboardingChecklist>> completeStep(String key) async {
    try {
      return Result<OnboardingChecklist>.ok(await _remote.completeStep(key));
    } on Object catch (error) {
      return Result<OnboardingChecklist>.err(mapExceptionToFailure(error));
    }
  }
}
