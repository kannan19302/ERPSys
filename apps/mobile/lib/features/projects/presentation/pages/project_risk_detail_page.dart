import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class ProjectRiskDetailPage extends ConsumerWidget {
  const ProjectRiskDetailPage({required this.riskId, super.key});
  static const String routeName = 'project-risk-detail';
  static const String routePath = '/projects/risks/:id';
  final String riskId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final riskAsync = ref.watch(projectRiskDetailProvider(riskId));

    return Scaffold(
      appBar: AppBar(title: const Text('Risk')),
      body: riskAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load risk.'),
          onRetry: () => ref.invalidate(projectRiskDetailProvider(riskId)),
        ),
        data: (r) => _RiskDetail(risk: r),
      ),
    );
  }
}

class _RiskDetail extends StatelessWidget {
  const _RiskDetail({required this.risk});
  final ProjectRisk risk;

  UiTone _statusTone(String status) => switch (status) {
        'MITIGATED' || 'CLOSED' => UiTone.success,
        'IN_PROGRESS' => UiTone.info,
        'IDENTIFIED' => UiTone.warning,
        _ => UiTone.neutral,
      };

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(child: Text(risk.title, style: Theme.of(context).textTheme.titleLarge)),
              UiStatusBadge(label: risk.status, tone: _statusTone(risk.status)),
            ],),
            if (risk.description != null && risk.description!.isNotEmpty) ...[
              const SizedBox(height: Spacing.x1),
              Text(risk.description!),
            ],
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Assessment'),
            _Row('Probability', risk.probability),
            _Row('Impact', risk.impact),
            _Row('Severity', '${risk.probability}/${risk.impact}'),
          ],
        ),),
        if (risk.mitigationPlan != null && risk.mitigationPlan!.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          UiCard(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Mitigation Plan'),
              Text(risk.mitigationPlan!),
            ],
          ),),
        ],
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ],),
    );
  }
}