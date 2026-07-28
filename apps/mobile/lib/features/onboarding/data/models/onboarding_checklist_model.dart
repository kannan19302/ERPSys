import '../../domain/entities/onboarding_checklist.dart';

class OnboardingChecklistModel extends OnboardingChecklist {
  const OnboardingChecklistModel({
    required super.profileComplete,
    required super.logoUploaded,
    required super.teammateInvited,
    required super.appInstalled,
    required super.planUpgraded,
    required super.dashboardVisited,
    required super.stepOrder,
    required super.priorityAppSlugs,
  });

  factory OnboardingChecklistModel.fromJson(Map<String, dynamic> json) {
    return OnboardingChecklistModel(
      profileComplete: json['profile'] as bool? ?? false,
      logoUploaded: json['logo'] as bool? ?? false,
      teammateInvited: json['invite'] as bool? ?? false,
      appInstalled: json['app'] as bool? ?? false,
      planUpgraded: json['plan'] as bool? ?? false,
      dashboardVisited: json['dashboard'] as bool? ?? false,
      stepOrder: _stringList(json['checklistOrder']),
      priorityAppSlugs: _stringList(json['priorityAppSlugs']),
    );
  }
}

List<String> _stringList(Object? value) =>
    value is List ? value.whereType<String>().toList(growable: false) : const <String>[];
