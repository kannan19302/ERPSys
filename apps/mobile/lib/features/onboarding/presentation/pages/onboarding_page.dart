import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/onboarding_checklist.dart';
import '../../../home/presentation/pages/home_page.dart';
import '../providers/onboarding_providers.dart';

class _StepMeta {
  const _StepMeta({
    required this.key,
    required this.icon,
    required this.title,
    required this.description,
    this.actionLabel,
    this.mobileAvailable = false,
  });

  final String key;
  final IconData icon;
  final String title;
  final String description;

  /// Null when there's nothing to tap — the step is purely informational
  /// here (its real action lives on the web app for now).
  final String? actionLabel;

  /// Only `dashboard` has a real in-app action today; the rest are genuine
  /// web-only admin flows (logo upload, billing, invites, marketplace) that
  /// don't have a Flutter screen yet — showing a fake button for them would
  /// be worse than being upfront about it.
  final bool mobileAvailable;
}

const List<_StepMeta> _stepCatalog = <_StepMeta>[
  _StepMeta(
    key: 'profile',
    icon: Icons.person_outline,
    title: 'Add your profile photo',
    description: 'Upload an avatar so teammates recognise you.',
    actionLabel: 'Manage on web',
  ),
  _StepMeta(
    key: 'logo',
    icon: Icons.image_outlined,
    title: 'Add your organisation logo',
    description: 'Shown on invoices, the storefront, and the sign-in screen.',
    actionLabel: 'Manage on web',
  ),
  _StepMeta(
    key: 'invite',
    icon: Icons.group_add_outlined,
    title: 'Invite your team',
    description: 'Bring in the people who will work in this workspace.',
    actionLabel: 'Manage on web',
  ),
  _StepMeta(
    key: 'app',
    icon: Icons.apps_outlined,
    title: 'Install an app from the Marketplace',
    description: 'Add the modules your business actually needs.',
    actionLabel: 'Browse on web',
  ),
  _StepMeta(
    key: 'plan',
    icon: Icons.workspace_premium_outlined,
    title: 'Choose a plan',
    description: 'Your workspace starts on a free trial.',
    actionLabel: 'Manage on web',
  ),
  _StepMeta(
    key: 'dashboard',
    icon: Icons.dashboard_outlined,
    title: 'Visit your dashboard',
    description: 'See a live snapshot of your workspace.',
    actionLabel: 'Go to dashboard',
    mobileAvailable: true,
  ),
];

/// Checklist view of `GET /auth/onboarding`. Reachable from Home's setup
/// banner, not forced on the user — the web app remains the primary surface
/// for the still-web-only steps (logo, invites, marketplace, billing).
class OnboardingPage extends ConsumerWidget {
  const OnboardingPage({super.key});

  static const String routeName = 'onboarding';
  static const String routePath = '/onboarding';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<OnboardingChecklist> state =
        ref.watch(onboardingControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Get set up')),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (Object error, StackTrace _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(Spacing.x6),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text('$error', textAlign: TextAlign.center),
                const SizedBox(height: Spacing.x4),
                OutlinedButton(
                  onPressed: () => ref.read(onboardingControllerProvider.notifier).refresh(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        data: (OnboardingChecklist checklist) => RefreshIndicator(
          onRefresh: () => ref.read(onboardingControllerProvider.notifier).refresh(),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(Spacing.x4),
            children: <Widget>[
              _ProgressHeader(checklist: checklist),
              const SizedBox(height: Spacing.x5),
              for (final String key in checklist.stepOrder.isEmpty
                  ? _stepCatalog.map((_StepMeta s) => s.key)
                  : checklist.stepOrder)
                _StepTile(
                  meta: _stepCatalog.firstWhere((_StepMeta s) => s.key == key),
                  done: checklist.isDone(key),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProgressHeader extends StatelessWidget {
  const _ProgressHeader({required this.checklist});

  final OnboardingChecklist checklist;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final double progress = checklist.completedCount / 6;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          checklist.isComplete ? "You're all set" : 'Finish setting up your workspace',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: Spacing.x2),
        Text(
          '${checklist.completedCount} of 6 steps complete',
          style: TextStyle(color: t.textSecondary),
        ),
        const SizedBox(height: Spacing.x3),
        ClipRRect(
          borderRadius: Radii.control,
          child: LinearProgressIndicator(
            value: progress,
            minHeight: Spacing.x2,
            backgroundColor: t.primaryLight,
            valueColor: AlwaysStoppedAnimation<Color>(t.primary),
          ),
        ),
      ],
    );
  }
}

class _StepTile extends ConsumerWidget {
  const _StepTile({required this.meta, required this.done});

  final _StepMeta meta;
  final bool done;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Palette t = context.tokens;

    return Card(
      margin: const EdgeInsets.only(bottom: Spacing.x3),
      child: ListTile(
        leading: Icon(
          done ? Icons.check_circle : meta.icon,
          color: done ? t.success : t.textTertiary,
        ),
        title: Text(
          meta.title,
          style: TextStyle(
            decoration: done ? TextDecoration.lineThrough : null,
            color: done ? t.textTertiary : null,
          ),
        ),
        subtitle: Text(meta.description),
        trailing: done
            ? null
            : meta.actionLabel == null
                ? null
                : TextButton(
                    onPressed: () => meta.mobileAvailable
                        ? _completeDashboard(context, ref)
                        : _showWebOnlyNotice(context),
                    child: Text(meta.actionLabel!),
                  ),
      ),
    );
  }

  void _completeDashboard(BuildContext context, WidgetRef ref) {
    ref.read(onboardingControllerProvider.notifier).completeDashboardStep();
    context.goNamed(HomePage.routeName);
  }

  void _showWebOnlyNotice(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('This step is managed from the web app for now.'),
      ),
    );
  }
}
