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
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class ActivityDetailPage extends ConsumerWidget {
  const ActivityDetailPage({required this.activityId, super.key});

  static const String routeName = 'activity-detail';
  static const String routePath = '/crm/activities/:id';

  final String activityId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Activity> activityAsync =
        ref.watch(activityDetailProvider(activityId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.crmActivityDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete activity',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: activityAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load activity.'),
          onRetry: () => ref.invalidate(activityDetailProvider(activityId)),
        ),
        data: (Activity activity) => _ActivityDetail(activity: activity),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete activity?'),
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

    final result = await ref
        .read(activitiesProvider.notifier)
        .delete(activityId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _ActivityDetail extends StatelessWidget {
  const _ActivityDetail({required this.activity});

  final Activity activity;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

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
                      activity.subject,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  if (activity.status != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Spacing.x2_5,
                        vertical: Spacing.x1,
                      ),
                      decoration: BoxDecoration(
                        color: activity.status == 'COMPLETED' ? t.successLight : t.bgSunken,
                        borderRadius: Radii.pill,
                      ),
                      child: Text(
                        activity.status!,
                        style: TextStyle(
                          color: activity.status == 'COMPLETED' ? t.success : t.textSecondary,
                          fontSize: TypeScale.xs,
                          fontWeight: TypeScale.medium,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              _TypeBadge(type: activity.type),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Details'),
              _FieldRow('Type', activity.type),
              if (activity.dueDate != null)
                _FieldRow('Due Date', Formatters.date(activity.dueDate!)),
              _FieldRow('Created', Formatters.dateTime(activity.createdAt ?? DateTime.now())),
            ],
          ),
        ),
        if (activity.description != null && activity.description!.isNotEmpty) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const _SectionTitle(title: 'Description'),
                Text(activity.description!),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _TypeBadge extends StatelessWidget {
  const _TypeBadge({required this.type});

  final String type;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (IconData icon, Color color) = switch (type) {
      'CALL' => (Icons.phone_outlined, t.info),
      'EMAIL' => (Icons.email_outlined, const Color(0xFF8B5CF6)),
      'MEETING' => (Icons.groups_outlined, t.warning),
      'TASK' => (Icons.check_circle_outline, t.success),
      _ => (Icons.notes_outlined, t.textSecondary),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.x2_5,
        vertical: Spacing.x1,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: Radii.pill,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(icon, size: TypeScale.sm, color: color),
          const SizedBox(width: Spacing.x1),
          Text(
            type,
            style: TextStyle(
              color: color,
              fontSize: TypeScale.xs,
              fontWeight: TypeScale.medium,
            ),
          ),
        ],
      ),
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
