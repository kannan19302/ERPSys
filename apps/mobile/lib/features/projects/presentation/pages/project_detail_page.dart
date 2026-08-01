import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

/// `GET /projects/:id`. Read-only.
class ProjectDetailPage extends ConsumerWidget {
  const ProjectDetailPage({required this.projectId, super.key});

  static const String routeName = 'project-detail';

  final String projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Project> projectAsync =
        ref.watch(projectDetailProvider(projectId));

    return Scaffold(
      appBar: AppBar(title: const Text('Project')),
      body: projectAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load project.'),
          onRetry: () => ref.invalidate(projectDetailProvider(projectId)),
        ),
        data: (Project project) => _ProjectDetail(project: project),
      ),
    );
  }
}

class _ProjectDetail extends StatelessWidget {
  const _ProjectDetail({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      project.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(label: project.status, tone: _statusTone(project.status)),
                ],
              ),
              const SizedBox(height: Spacing.x1),
              if (project.description.isNotEmpty) Text(project.description),
              const SizedBox(height: Spacing.x3),
              LinearProgressIndicator(value: (project.progress / 100).clamp(0, 1)),
              const SizedBox(height: Spacing.x1),
              Text(
                '${Formatters.percent(project.progress, decimals: 0)} complete',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Budget'),
              _Row('Budget', Formatters.currency(project.budget)),
              _Row('Actual cost', Formatters.currency(project.actualCost)),
              _Row('Priority', project.priority),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Details'),
              _Row('Manager', project.managerName ?? '—'),
              _Row('Customer', project.customerName ?? '—'),
              _Row(
                'Start date',
                project.startDate == null ? '—' : Formatters.date(project.startDate!),
              ),
              _Row(
                'End date',
                project.endDate == null ? '—' : Formatters.date(project.endDate!),
              ),
            ],
          ),
        ),
      ],
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'COMPLETED' => UiTone.success,
        'ON_HOLD' => UiTone.warning,
        'CANCELLED' => UiTone.danger,
        'IN_PROGRESS' => UiTone.info,
        _ => UiTone.neutral,
      };
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);

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
