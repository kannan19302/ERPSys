import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class HrDashboardPage extends ConsumerWidget {
  const HrDashboardPage({super.key});

  static const String routeName = 'hr-dashboard';
  static const String routePath = '/hr';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<HrDashboardStats> asyncStats =
        ref.watch(hrDashboardProvider);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('HR Dashboard')),
      body: asyncStats.when(
        loading: () => const LoadingView(),
        error: (Object e, StackTrace _) => FailureView(
          failure: e is Failure ? e as Failure : ServerFailure(e.toString()),
          onRetry: () => ref.invalidate(hrDashboardProvider),
        ),
        data: (HrDashboardStats stats) => _DashboardContent(stats: stats),
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  const _DashboardContent({required this.stats});

  final HrDashboardStats stats;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        // KPI Cards
        Wrap(
          spacing: Spacing.x3,
          runSpacing: Spacing.x3,
          children: <Widget>[
            _KpiCard(
              icon: Icons.people_outline,
              label: 'Total Employees',
              value: '${stats.totalEmployees}',
              color: t.primary,
            ),
            _KpiCard(
              icon: Icons.person_outline,
              label: 'Active',
              value: '${stats.activeEmployees}',
              color: t.success,
            ),
            _KpiCard(
              icon: Icons.beach_access_outlined,
              label: 'On Leave',
              value: '${stats.onLeave}',
              color: t.warning,
            ),
            _KpiCard(
              icon: Icons.pending_actions_outlined,
              label: 'Pending Requests',
              value: '${stats.pendingLeaveRequests}',
              color: t.info,
            ),
            _KpiCard(
              icon: Icons.account_tree_outlined,
              label: 'Departments',
              value: '${stats.departments}',
              color: t.textSecondary,
            ),
            _KpiCard(
              icon: Icons.work_outline,
              label: 'Open Positions',
              value: '${stats.openPositions}',
              color: t.danger,
            ),
          ],
        ),
        const SizedBox(height: Spacing.x6),
        // Department summary card
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Organization Summary'),
              _SummaryRow('Total Employees', '${stats.totalEmployees}'),
              _SummaryRow('Active Employees', '${stats.activeEmployees}'),
              _SummaryRow('Currently on Leave', '${stats.onLeave}'),
              _SummaryRow('Departments', '${stats.departments}'),
              _SummaryRow('Open Positions', '${stats.openPositions}'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        // Quick actions
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Quick Actions'),
              ListTile(
                leading: const Icon(Icons.person_add_outlined),
                title: const Text('Add Employee'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {},
              ),
              ListTile(
                leading: const Icon(Icons.beach_access_outlined),
                title: const Text('Review Leave Requests'),
                trailing: Text(
                  '${stats.pendingLeaveRequests} pending',
                  style: TextStyle(
                    color: t.warning,
                    fontSize: TypeScale.xs,
                  ),
                ),
                onTap: () {},
              ),
              ListTile(
                leading: const Icon(Icons.receipt_long_outlined),
                title: const Text('Process Payroll'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {},
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return SizedBox(
      width: (MediaQuery.sizeOf(context).width - Spacing.x4 * 2 - Spacing.x3) /
          2,
      child: UiCard(
        padding: const EdgeInsets.all(Spacing.x3),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Container(
              padding: const EdgeInsets.all(Spacing.x2),
              decoration: BoxDecoration(
                color: color.withAlpha(25),
                borderRadius: BorderRadius.all(Radius.circular(Radii.sm)),
              ),
              child: Icon(icon, color: color, size: TypeScale.xl),
            ),
            const SizedBox(height: Spacing.x2),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: TypeScale.bold,
                    color: t.text,
                  ),
            ),
            const SizedBox(height: Spacing.x0_5),
            Text(
              label,
              style: TextStyle(
                color: t.textSecondary,
                fontSize: TypeScale.xs,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: TypeScale.semibold,
              color: t.text,
            ),
          ),
        ],
      ),
    );
  }
}