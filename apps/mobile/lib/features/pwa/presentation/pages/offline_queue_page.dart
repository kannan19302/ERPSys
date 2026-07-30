import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/pwa.dart';
import '../providers/pwa_providers.dart';

class OfflineQueuePage extends ConsumerWidget {
  const OfflineQueuePage({super.key});
  static const String routeName = 'offline-queue';
  static const String routePath = '/pwa/offline-queue';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(offlineQueueListControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Offline Queue')),
      body: state.isLoading
          ? const LoadingView()
          : state.items.isEmpty
              ? const EmptyView(title: 'Queue is empty', message: 'No pending offline actions')
              : ListView.separated(
                  padding: const EdgeInsets.all(Spacing.x4),
                  itemCount: state.items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: Spacing.x2),
                  itemBuilder: (_, i) => _QueueCard(item: state.items[i]),
                ),
    );
  }
}

class _QueueCard extends StatelessWidget {
  const _QueueCard({required this.item});
  final PwaOfflineQueueItem item;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final (IconData icon, Color color) = switch (item.status) {
      'PENDING' => (Icons.hourglass_empty, t.warning),
      'SYNCING' => (Icons.sync, t.info),
      'SYNCED' => (Icons.check_circle, t.success),
      'FAILED' => (Icons.error, t.danger),
      _ => (Icons.help_outline, t.textSecondary),
    };

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, color: color, size: TypeScale.xl),
          const SizedBox(width: Spacing.x2),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(item.actionType, style: TextStyle(fontWeight: TypeScale.semibold, color: t.text)),
            Text('Retry #${item.retryCount}', style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
          ])),
          Text(item.status, style: TextStyle(color: color, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),
        ]),
        const SizedBox(height: Spacing.x2),
        Text('Created: ${item.createdAt != null ? Formatters.dateTime(item.createdAt!) : "—"}', style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
        if (item.errorMessage != null) Padding(padding: const EdgeInsets.only(top: Spacing.x1), child: Text(item.errorMessage!, style: TextStyle(color: t.danger, fontSize: TypeScale.xs))),
        if (item.syncedAt != null) Padding(padding: const EdgeInsets.only(top: Spacing.x1), child: Text('Synced: ${Formatters.dateTime(item.syncedAt!)}', style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs))),
      ]),
    );
  }
}