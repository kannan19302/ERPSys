import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';
import '../../../../core/usecase/result.dart';

class OpportunityDetailPage extends ConsumerWidget {
  const OpportunityDetailPage({required this.opportunityId, super.key});

  static const String routeName = 'opportunity-detail';
  static const String routePath = '/sales/opportunities/:id';

  final String opportunityId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Opportunity> oppAsync =
        ref.watch(opportunityDetailProvider(opportunityId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Opportunity'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete opportunity',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: oppAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load opportunity.'),
          onRetry: () => ref.invalidate(opportunityDetailProvider(opportunityId)),
        ),
        data: (Opportunity opp) => _OpportunityDetail(opp: opp, ref: ref),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete opportunity?'),
        content: const Text('This cannot be undone.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result =
        await ref.read(opportunitiesProvider.notifier).delete(opportunityId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _OpportunityDetail extends ConsumerWidget {
  const _OpportunityDetail({required this.opp, required this.ref});

  final Opportunity opp;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Palette t = context.tokens;
    final double pct = (opp.probability ?? 0).clamp(0, 100);

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
                      opp.title,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: opp.stage,
                    tone: _stageTone(opp.stage),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              Text(
                opp.company ?? opp.customerName,
                style: TextStyle(color: t.textSecondary),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Deal Information'),
              if (opp.expectedRevenue != null)
                _Row('Amount', Formatters.currency(opp.expectedRevenue!)),
              if (opp.currency != null)
                _Row('Currency', opp.currency!),
              if (opp.closeDate != null)
                _Row('Expected Close', Formatters.date(opp.closeDate!)),
              _Row('Probability', '${pct.round()}%'),
              const SizedBox(height: Spacing.x2),
              ClipRRect(
                borderRadius: Radii.pill,
                child: LinearProgressIndicator(
                  value: pct / 100,
                  backgroundColor: t.bgSunken,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _probabilityColor(t, pct),
                  ),
                  minHeight: 6,
                ),
              ),
              if (opp.pipelineName != null) ...[
                const SizedBox(height: Spacing.x2),
                _Row('Pipeline', opp.pipelineName!),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Contact'),
              _Row('Customer', opp.customerName),
              if (opp.contactName != null)
                _Row('Contact', opp.contactName!),
              if (opp.assignedTo != null)
                _Row('Assigned To', opp.assignedTo!),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Details'),
              if (opp.notes != null && opp.notes!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: Spacing.x2),
                  child: Text(opp.notes!),
                ),
              if (opp.createdAt != null)
                _Row('Created', Formatters.dateTime(opp.createdAt!)),
              if (opp.updatedAt != null)
                _Row('Updated', Formatters.dateTime(opp.updatedAt!)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        Row(
          children: <Widget>[
            Expanded(
              child: FilledButton(
                onPressed: () => _moveStage(context, ref),
                child: const Text('Move Stage'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  static Color _probabilityColor(Palette t, double pct) {
    if (pct >= 75) return t.success;
    if (pct >= 40) return t.warning;
    return t.textTertiary;
  }

  static UiTone _stageTone(String stage) => switch (stage.toUpperCase()) {
        'PROSPECTING' => UiTone.info,
        'QUALIFICATION' => UiTone.neutral,
        'NEGOTIATION' => UiTone.warning,
        'CLOSED_WON' => UiTone.success,
        'CLOSED_LOST' => UiTone.danger,
        _ => UiTone.neutral,
      };

  Future<void> _moveStage(BuildContext context, WidgetRef ref) async {
    final String? newStage = await showDialog<String>(
      context: context,
      builder: (BuildContext dialogContext) => SimpleDialog(
        title: const Text('Move to stage'),
        children: <String>['PROSPECTING', 'QUALIFICATION', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
            .map((String stage) => SimpleDialogOption(
                  onPressed: () => Navigator.of(dialogContext).pop(stage),
                  child: Text(stage),
                ),)
            .toList(),
      ),
    );
    if (newStage == null || !context.mounted) return;

    final Result<Opportunity> result =
        await ref.read(opportunitiesProvider.notifier).updateStage(opp.id, newStage);
    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Moved to $newStage'))),
    );
  }
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
