import 'package:equatable/equatable.dart';

/// Mirrors `GET /auth/onboarding`
/// (apps/api/src/modules/auth/onboarding.service.ts). Five of the six steps
/// are derived live from real backend state; only [dashboardVisited] is a
/// client-settable flag (`PUT /auth/onboarding/complete/dashboard`).
class OnboardingChecklist extends Equatable {
  const OnboardingChecklist({
    required this.profileComplete,
    required this.logoUploaded,
    required this.teammateInvited,
    required this.appInstalled,
    required this.planUpgraded,
    required this.dashboardVisited,
    required this.stepOrder,
    required this.priorityAppSlugs,
  });

  final bool profileComplete;
  final bool logoUploaded;
  final bool teammateInvited;
  final bool appInstalled;
  final bool planUpgraded;
  final bool dashboardVisited;

  /// Step keys in the order the tenant's industry prefers them shown.
  final List<String> stepOrder;

  /// Marketplace app slugs worth suggesting first, industry-matched.
  final List<String> priorityAppSlugs;

  bool get isComplete =>
      profileComplete &&
      logoUploaded &&
      teammateInvited &&
      appInstalled &&
      planUpgraded &&
      dashboardVisited;

  int get completedCount => <bool>[
        profileComplete,
        logoUploaded,
        teammateInvited,
        appInstalled,
        planUpgraded,
        dashboardVisited,
      ].where((bool done) => done).length;

  bool isDone(String key) => switch (key) {
        'profile' => profileComplete,
        'logo' => logoUploaded,
        'invite' => teammateInvited,
        'app' => appInstalled,
        'plan' => planUpgraded,
        'dashboard' => dashboardVisited,
        _ => false,
      };

  @override
  List<Object?> get props => <Object?>[
        profileComplete,
        logoUploaded,
        teammateInvited,
        appInstalled,
        planUpgraded,
        dashboardVisited,
        stepOrder,
        priorityAppSlugs,
      ];
}
