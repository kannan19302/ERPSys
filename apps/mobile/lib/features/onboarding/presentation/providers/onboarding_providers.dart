import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/onboarding_remote_datasource.dart';
import '../../data/repositories/onboarding_repository_impl.dart';
import '../../domain/entities/onboarding_checklist.dart';
import '../../domain/repositories/onboarding_repository.dart';
import '../../domain/usecases/onboarding_usecases.dart';

final Provider<OnboardingRemoteDataSource> onboardingRemoteDataSourceProvider =
    Provider<OnboardingRemoteDataSource>(
  (Ref ref) => OnboardingRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<OnboardingRepository> onboardingRepositoryProvider =
    Provider<OnboardingRepository>(
  (Ref ref) =>
      OnboardingRepositoryImpl(ref.watch(onboardingRemoteDataSourceProvider)),
);

/// Live checklist state. Re-fetches on tenant switch and whenever a step
/// completes (see [OnboardingController.completeDashboardStep]).
final AsyncNotifierProvider<OnboardingController, OnboardingChecklist>
    onboardingControllerProvider =
    AsyncNotifierProvider<OnboardingController, OnboardingChecklist>(
  OnboardingController.new,
);

class OnboardingController extends AsyncNotifier<OnboardingChecklist> {
  @override
  Future<OnboardingChecklist> build() async {
    ref.watch(activeTenantIdProvider);
    final Result<OnboardingChecklist> result =
        await GetOnboardingStateUseCase(ref.watch(onboardingRepositoryProvider))(
      const NoParams(),
    );
    return result.fold(
      (Failure failure) => throw failure,
      (OnboardingChecklist checklist) => checklist,
    );
  }

  /// The only step a client can mark done — "the user opened their
  /// dashboard" has no better backend proxy (see onboarding.service.ts).
  Future<void> completeDashboardStep() async {
    final Result<OnboardingChecklist> result = await CompleteOnboardingStepUseCase(
      ref.read(onboardingRepositoryProvider),
    )('dashboard');
    result.fold(
      (Failure _) => null,
      (OnboardingChecklist checklist) => state = AsyncData<OnboardingChecklist>(checklist),
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading<OnboardingChecklist>();
    state = await AsyncValue.guard(
      () async {
        final Result<OnboardingChecklist> result =
            await GetOnboardingStateUseCase(ref.read(onboardingRepositoryProvider))(
          const NoParams(),
        );
        return result.fold(
          (Failure failure) => throw failure,
          (OnboardingChecklist checklist) => checklist,
        );
      },
    );
  }
}
