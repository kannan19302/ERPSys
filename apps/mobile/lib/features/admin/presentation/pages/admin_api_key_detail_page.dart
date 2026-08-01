import 'package:flutter/material.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../domain/entities/admin.dart';
import '../providers/admin_providers.dart';

class AdminApiKeyDetailPage extends ConsumerWidget {
  const AdminApiKeyDetailPage({required this.apiKeyId, super.key});
  static const String routeName = 'admin-api-key-detail';
  static const String routePath = '/admin/api-keys/:id';
  final String apiKeyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<AdminApiKey> keyAsync = ref.watch(adminApiKeyDetailProvider(apiKeyId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('API Key'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.adminApiKeyDelete,
            child: keyAsync.whenOrNull(
              data: (AdminApiKey _) => IconButton(
                icon: const Icon(Icons.delete_outline),
                tooltip: 'Delete key',
                onPressed: () => _confirmDelete(context, ref),
              ),
            ) ?? const SizedBox.shrink(),
          ),
        ],
      ),
      body: keyAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load API key.'),
          onRetry: () => ref.invalidate(adminApiKeyDetailProvider(apiKeyId)),
        ),
        data: (AdminApiKey key) => _ApiKeyDetail(apiKey: key),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dc) => AlertDialog(
        title: const Text('Delete API key?'),
        content: const Text('Applications using this key will lose access immediately.'),
        actions: <Widget>[
          TextButton(onPressed: () => Navigator.of(dc).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(dc).pop(true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result = await ref.read(adminApiKeyListControllerProvider.notifier).delete(apiKeyId);
    if (!context.mounted) return;
    result.fold(
      (Failure f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _ApiKeyDetail extends StatefulWidget {
  const _ApiKeyDetail({required this.apiKey});
  final AdminApiKey apiKey;

  @override
  State<_ApiKeyDetail> createState() => _ApiKeyDetailState();
}

class _ApiKeyDetailState extends State<_ApiKeyDetail> {
  bool _keyRevealed = false;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final AdminApiKey key = widget.apiKey;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(children: <Widget>[
                Expanded(child: Text(key.name, style: Theme.of(context).textTheme.titleLarge)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                  decoration: BoxDecoration(
                    color: key.isActive ? t.successLight : t.bgSunken, borderRadius: Radii.pill,
                  ),
                  child: Text(key.isActive ? 'Active' : 'Inactive',
                      style: TextStyle(color: key.isActive ? t.success : t.textSecondary,
                          fontSize: TypeScale.xs, fontWeight: TypeScale.medium,),),
                ),
              ],),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Key'),
              Row(children: <Widget>[
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(Spacing.x3),
                    decoration: BoxDecoration(color: t.bgSunken, borderRadius: Radii.control),
                    child: SelectableText(
                      _keyRevealed ? (key.key ?? '—') : (key.maskedKey ?? '—'),
                      style: const TextStyle(fontFamily: 'monospace', fontSize: TypeScale.sm),
                    ),
                  ),
                ),
                const SizedBox(width: Spacing.x2),
                IconButton(
                  icon: Icon(_keyRevealed ? Icons.visibility_off : Icons.visibility, size: TypeScale.xl),
                  onPressed: () => setState(() => _keyRevealed = !_keyRevealed),
                ),
              ],),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Details'),
              _FieldRow('Last used', key.lastUsedAt != null ? _fmt(key.lastUsedAt!) : 'Never'),
              _FieldRow('Expires', key.expiresAt != null ? _fmt(key.expiresAt!) : 'Never'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Permissions'),
              if (key.permissions.isEmpty)
                Text('No permissions', style: TextStyle(color: t.textTertiary))
              else
                ...key.permissions.map((String p) => Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: Spacing.x1_5),
                  padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1_5),
                  decoration: BoxDecoration(color: t.bgSunken, borderRadius: Radii.control),
                  child: Text(p, style: const TextStyle(fontSize: TypeScale.xs, fontFamily: 'monospace')),
                ),),
            ],
          ),
        ),
      ],
    );
  }

  String _fmt(DateTime dt) => '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity, padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: Spacing.x3),
    child: Text(title, style: Theme.of(context).textTheme.titleMedium),
  );
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
      child: Row(children: <Widget>[
        Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ],),
    );
  }
}