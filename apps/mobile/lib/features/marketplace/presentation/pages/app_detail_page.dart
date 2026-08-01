import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/marketplace.dart';
import '../providers/marketplace_providers.dart';

class MarketplaceAppDetailPage extends ConsumerWidget {
  const MarketplaceAppDetailPage({required this.appId, super.key});
  static const String routeName = 'marketplace-app-detail';
  static const String routePath = '/marketplace/apps/:id';
  final String appId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(marketplaceAppDetailProvider(appId));
    return Scaffold(
      appBar: AppBar(title: const Text('App'), actions: [
        IconButton(icon: const Icon(Icons.delete_outline), tooltip: 'Delete', onPressed: () async {
          final confirmed = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
            title: const Text('Delete app?'), content: const Text('This cannot be undone.'),
            actions: [TextButton(onPressed: () => Navigator.of(c).pop(false), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.of(c).pop(true), child: const Text('Delete'))],
          ),);
          if (confirmed != true || !context.mounted) return;
          final r = await ref.read(marketplaceAppListControllerProvider.notifier).delete(appId);
          if (!context.mounted) return;
          r.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
        },),
      ],),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(failure: e is Failure ? e : const ServerFailure('Could not load app.'), onRetry: () => ref.invalidate(marketplaceAppDetailProvider(appId))),
        data: (a) => _AppDetail(app: a),
      ),
    );
  }
}

class _AppDetail extends StatelessWidget {
  const _AppDetail({required this.app}); final MarketplaceApp app;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
      _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.apps, color: t.primary, size: 40), const SizedBox(width: Spacing.x3),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(app.name, style: Theme.of(context).textTheme.titleLarge),
            if (app.developer != null) Text(app.developer!, style: TextStyle(color: t.textSecondary)),
          ],),),
          if (app.rating != null) Row(children: [const Icon(Icons.star, color: Colors.amber, size: TypeScale.lg), Text('', style: Theme.of(context).textTheme.labelLarge)]),
        ],),
        if (app.description != null) Padding(padding: const EdgeInsets.only(top: Spacing.x2), child: Text(app.description!, style: TextStyle(color: t.textSecondary))),
      ],),),
      const SizedBox(height: Spacing.x4),
      _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const _SectionTitle(title: 'Details'),
        _FieldRow('Category', app.category ?? ''), _FieldRow('Version', app.version ?? ''),
        _FieldRow('Status', app.status), _FieldRow('Downloads', Formatters.compact(app.downloadCount)),
        const _FieldRow('Reviews', ''), _FieldRow('Currency', app.currency),
        if (app.price > 0) _FieldRow('Price', Formatters.currency(app.price, currencyCode: app.currency)),
      ],),),
    ],);
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
