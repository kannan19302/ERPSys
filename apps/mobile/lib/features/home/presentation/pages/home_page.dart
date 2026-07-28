import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../../inventory/domain/entities/product.dart';
import '../../../inventory/presentation/providers/inventory_providers.dart';
import '../../../onboarding/domain/entities/onboarding_checklist.dart';
import '../../../onboarding/presentation/pages/onboarding_page.dart';
import '../../../onboarding/presentation/providers/onboarding_providers.dart';

/// Landing screen after sign-in — a condensed dashboard, not a full mirror of
/// the web dashboard's widget grid. Deep modules stay reachable from the tab
/// bar / drawer rather than duplicated here.
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  static const String routeName = 'home';
  static const String routePath = '/';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final tenant = ref.watch(authControllerProvider).tenant;
    final AsyncValue<InventoryStats> stats = ref.watch(inventoryStatsProvider);
    final AsyncValue<OnboardingChecklist> onboarding =
        ref.watch(onboardingControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(tenant?.name ?? 'UniERP'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(inventoryStatsProvider),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(Spacing.x4),
          children: <Widget>[
            Text(
              'Welcome back${user == null ? '' : ', ${user.firstName}'}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: Spacing.x4),
            onboarding.when(
              loading: () => const SizedBox.shrink(),
              error: (Object _, StackTrace __) => const SizedBox.shrink(),
              data: (OnboardingChecklist checklist) => checklist.isComplete
                  ? const SizedBox.shrink()
                  : Padding(
                      padding: const EdgeInsets.only(bottom: Spacing.x2),
                      child: _OnboardingBanner(checklist: checklist),
                    ),
            ),
            const SizedBox(height: Spacing.x2),
            PermissionGate(
              permission: Permissions.productRead,
              child: _StatsSection(stats: stats),
            ),
            const SizedBox(height: Spacing.x6),
            const UiSectionHeader(title: 'Quick actions'),
            const _QuickActions(),
          ],
        ),
      ),
    );
  }
}

class _OnboardingBanner extends StatelessWidget {
  const _OnboardingBanner({required this.checklist});

  final OnboardingChecklist checklist;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return UiCard(
      onTap: () => context.pushNamed(OnboardingPage.routeName),
      child: Row(
        children: <Widget>[
          Icon(Icons.flag_outlined, color: t.primary),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Finish setting up', style: Theme.of(context).textTheme.labelLarge),
                Text(
                  '${checklist.completedCount} of 6 steps complete',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: t.textTertiary),
        ],
      ),
    );
  }
}

class _StatsSection extends StatelessWidget {
  const _StatsSection({required this.stats});

  final AsyncValue<InventoryStats> stats;

  @override
  Widget build(BuildContext context) {
    return stats.when(
      loading: () => const _StatsGridSkeleton(),
      error: (Object _, StackTrace __) => const SizedBox.shrink(),
      data: (InventoryStats data) => GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: Spacing.x3,
        crossAxisSpacing: Spacing.x3,
        childAspectRatio: 1.6,
        children: <Widget>[
          _StatTile(
            label: 'Products',
            value: Formatters.compact(data.totalProducts),
            icon: Icons.inventory_2_outlined,
          ),
          _StatTile(
            label: 'Active products',
            value: Formatters.compact(data.activeProducts),
            icon: Icons.check_circle_outline,
          ),
          _StatTile(
            label: 'Warehouses',
            value: Formatters.compact(data.totalWarehouses),
            icon: Icons.warehouse_outlined,
          ),
          _StatTile(
            label: 'Low stock',
            value: Formatters.compact(data.lowStockItems),
            icon: Icons.warning_amber_outlined,
            tone: data.lowStockItems > 0 ? UiTone.warning : UiTone.neutral,
          ),
        ],
      ),
    );
  }
}

class _StatsGridSkeleton extends StatelessWidget {
  const _StatsGridSkeleton();

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: Spacing.x3,
      crossAxisSpacing: Spacing.x3,
      childAspectRatio: 1.6,
      children: List<Widget>.generate(
        4,
        (_) => UiCard(
          child: Center(
            child: SizedBox(
              height: Spacing.x5,
              width: Spacing.x5,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.grey.shade300),
            ),
          ),
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    required this.icon,
    this.tone = UiTone.neutral,
  });

  final String label;
  final String value;
  final IconData icon;
  final UiTone tone;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final Color iconColor = switch (tone) {
      UiTone.warning => t.warning,
      UiTone.success => t.success,
      UiTone.danger => t.danger,
      UiTone.info => t.info,
      UiTone.neutral => t.primary,
    };

    return UiCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, color: iconColor, size: TypeScale.xl),
          const Spacer(),
          Text(value, style: Theme.of(context).textTheme.headlineSmall),
          Text(label, style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        PermissionGate(
          permission: Permissions.productRead,
          child: _ActionTile(
            icon: Icons.inventory_2_outlined,
            title: 'Browse products',
            onTap: () => context.pushNamed('products'),
          ),
        ),
        const SizedBox(height: Spacing.x2),
        _ActionTile(
          icon: Icons.notifications_outlined,
          title: 'Notifications',
          onTap: () => context.pushNamed('notifications'),
        ),
      ],
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({required this.icon, required this.title, required this.onTap});

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return UiCard(
      onTap: onTap,
      child: Row(
        children: <Widget>[
          Icon(icon, color: context.tokens.primary),
          const SizedBox(width: Spacing.x3),
          Expanded(child: Text(title, style: Theme.of(context).textTheme.labelLarge)),
          Icon(Icons.chevron_right, color: context.tokens.textTertiary),
        ],
      ),
    );
  }
}
