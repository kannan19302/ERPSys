import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/reporting.dart';
import '../providers/reporting_providers.dart';

class ReportComplianceDetailPage extends ConsumerWidget {
  const ReportComplianceDetailPage({required this.complianceId, super.key});
  static const String routeName = 'compliance-detail';
  static const String routePath = '/reporting/compliance/:id';
  final String complianceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(reportComplianceDetailProvider(complianceId));
    return Scaffold(
      appBar: AppBar(title: const Text('Compliance Record')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(
          failure: e is Failure ? e : const ServerFailure('Could not load compliance record.'),
          onRetry: () => ref.invalidate(reportComplianceDetailProvider(complianceId)),
        ),
        data: (c) => _ComplianceDetail(compliance: c),
      ),
    );
  }
}

class _ComplianceDetail extends StatelessWidget {
  const _ComplianceDetail({required this.compliance});
  final ReportCompliance compliance;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final (String statusLabel, Color statusColor, Color statusBg) = switch (compliance.status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'OVERDUE' => ('Overdue', t.danger, t.dangerLight),
      _ => ('Inactive', t.textSecondary, t.bgSunken),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Icon(Icons.verified_outlined, color: t.primary, size: 40),
              const SizedBox(width: Spacing.x3),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(compliance.name, style: Theme.of(context).textTheme.titleLarge),
                if (compliance.regulation != null) Text(compliance.regulation!, style: TextStyle(color: t.textSecondary)),
              ])),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                decoration: BoxDecoration(color: statusBg, borderRadius: Radii.pill),
                child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),
              ),
            ]),
          ]),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Details'),
          _FieldRow('Regulation', compliance.regulation ?? '—'),
          _FieldRow('Status', statusLabel),
          _FieldRow('Findings', '${compliance.findings}'),
          if (compliance.lastRunAt != null) _FieldRow('Last Run', Formatters.dateTime(compliance.lastRunAt!)),
          if (compliance.nextRunAt != null) _FieldRow('Next Run', Formatters.dateTime(compliance.nextRunAt!)),
          if (compliance.createdAt != null) _FieldRow('Created', Formatters.dateTime(compliance.createdAt!)),
        ])),
        if (compliance.isOverdue)
          Padding(
            padding: const EdgeInsets.only(top: Spacing.x4),
            child: _SectionCard(
              child: Row(children: [
                Icon(Icons.warning_amber_rounded, color: t.danger, size: Spacing.x5),
                const SizedBox(width: Spacing.x2),
                Text('Overdue - action required', style: TextStyle(color: t.danger)),
              ]),
            ),
          ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child}); final Widget child;
  @override Widget build(BuildContext context) { final t = context.tokens; return Container(width: double.infinity, padding: const EdgeInsets.all(Spacing.x4), decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)), child: child); }
}
class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title}); final String title;
  @override Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(bottom: Spacing.x3), child: Text(title, style: Theme.of(context).textTheme.titleMedium));
}
class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value); final String label; final String value;
  @override Widget build(BuildContext context) { final t = context.tokens; return Padding(padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5), child: Row(children: [Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))), Text(value, style: Theme.of(context).textTheme.labelLarge)])); }
}
