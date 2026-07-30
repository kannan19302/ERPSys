$base = "C:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile"

# Helper templates as arrays of strings
function Detail-Page($entity, $import, $provider, $title, $sections) {
@"
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '$import';
import '$provider';

class ${entity}DetailPage extends ConsumerWidget {
  const ${entity}DetailPage({required this.${entity[0].ToString().ToLower()}Id, super.key});

  static const String routeName = '${entity[0].ToString().ToLower()}-detail';
  static const String routePath = '/${title}/${entity.ToLower()}s/:id';

  final String ${entity[0].ToString().ToLower()}Id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<${entity}> ${entity[0].ToString().ToLower()}Async =
        ref.watch(${entity[0].ToString().ToLower()}DetailProvider(${entity[0].ToString().ToLower()}Id));

    return Scaffold(
      appBar: AppBar(
        title: const Text('${entity}'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.${entity.ToLower()}Delete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete ${entity.ToLower()}',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: ${entity[0].ToString().ToLower()}Async.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load ${entity.ToLower()}.'),
          onRetry: () => ref.invalidate(${entity[0].ToString().ToLower()}DetailProvider(${entity[0].ToString().ToLower()}Id)),
        ),
        data: (${entity} item) => _${entity}Detail(item: item),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete ${entity.ToLower()}?'),
        content: const Text('This cannot be undone.'),
        actions: <Widget>[
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(dialogContext).pop(true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    $sections
  }
}

class _${entity}Detail extends StatelessWidget {
  const _${entity}Detail({required this.item});

  final ${entity} item;

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
              Text(item.name, style: Theme.of(context).textTheme.titleLarge),
              if (item.description != null && item.description!.isNotEmpty) ...[
                const SizedBox(height: Spacing.x2),
                Text(item.description!, style: TextStyle(color: t.textSecondary)),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Details'),
              _FieldRow('ID', item.id),
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
        color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border),
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
          Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
"@
}
Write-Host "Script ready - use functions to generate"