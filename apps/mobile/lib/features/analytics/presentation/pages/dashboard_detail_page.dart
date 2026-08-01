import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/analytics.dart';
import '../providers/analytics_providers.dart';

class DashboardDetailPage extends ConsumerWidget {
  const DashboardDetailPage({required this.dashboardId, super.key});

  static const String routeName = 'dashboard-detail';
  static const String routePath = '/analytics/dashboards/:id';

  final String dashboardId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<AnalyticsDashboard> dashboardAsync =
        ref.watch(analyticsDashboardDetailProvider(dashboardId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
      ),
      body: dashboardAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load dashboard.'),
          onRetry: () => ref.invalidate(analyticsDashboardDetailProvider(dashboardId)),
        ),
        data: (AnalyticsDashboard dashboard) => _DashboardDetail(dashboard: dashboard),
      ),
    );
  }
}

class _DashboardDetail extends StatelessWidget {
  const _DashboardDetail({required this.dashboard});

  final AnalyticsDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, Color statusColor, Color statusBg) =
        switch (dashboard.status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'ARCHIVED' => ('Archived', t.danger, t.dangerLight),
      _ => ('Active', t.success, t.successLight),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      dashboard.title,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.x2_5,
                      vertical: Spacing.x1,
                    ),
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: Radii.pill,
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: TypeScale.xs,
                        fontWeight: TypeScale.medium,
                      ),
                    ),
                  ),
                ],
              ),
              if (dashboard.description != null) ...<Widget>[
                const SizedBox(height: Spacing.x2),
                Text(dashboard.description!, style: TextStyle(color: t.textSecondary)),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Widgets'),
              if (dashboard.widgets.isEmpty)
                Text('No widgets', style: TextStyle(color: t.textSecondary))
              else
                ...dashboard.widgets.map((DashboardWidget w) => Padding(
                      padding: const EdgeInsets.only(bottom: Spacing.x2),
                      child: Row(
                        children: <Widget>[
                          Icon(Icons.widgets_outlined, size: TypeScale.xl, color: t.primary),
                          const SizedBox(width: Spacing.x2),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Text(w.title ?? w.widgetType ?? 'Widget',
                                    style: Theme.of(context).textTheme.labelLarge,),
                                if (w.widgetType != null)
                                  Text(w.widgetType!,
                                      style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Details'),
              _FieldRow('Status', statusLabel),
              _FieldRow('Created', dashboard.createdAt != null ? Formatters.dateTime(dashboard.createdAt!) : '—'),
              _FieldRow('Updated', dashboard.updatedAt != null ? Formatters.dateTime(dashboard.updatedAt!) : '—'),
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(
        color: t.bgElevated,
        borderRadius: Radii.card,
        border: Border.all(color: t.border),
      ),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.x3),
      child: Text(title, style: Theme.of(context).textTheme.titleMedium),
    );
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value);

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
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
