import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/manufacturing.dart';
import '../providers/manufacturing_providers.dart';

class BomDetailPage extends ConsumerWidget {
  const BomDetailPage({required this.bomId, super.key});
  static const String routeName = 'bom-detail';
  static const String routePath = '/manufacturing/boms/:id';
  final String bomId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bomAsync = ref.watch(bomDetailProvider(bomId));

    return Scaffold(
      appBar: AppBar(title: const Text('Bill of Materials')),
      body: bomAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load BOM.'),
          onRetry: () => ref.invalidate(bomDetailProvider(bomId)),
        ),
        data: (bom) => _BomDetail(bom: bom),
      ),
    );
  }
}

class _BomDetail extends StatelessWidget {
  const _BomDetail({required this.bom});
  final Bom bom;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(child: Text(bom.name,
                  style: Theme.of(context).textTheme.titleLarge)),
              UiStatusBadge(label: bom.status, tone: _statusTone(bom.status)),
            ]),
            const SizedBox(height: Spacing.x1),
            Text(bom.productName, style: TextStyle(color: t.textSecondary)),
          ],
        )),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Details'),
            _Row('Type', bom.type),
            _Row('Quantity', bom.quantity.toStringAsFixed(2)),
            if (bom.wastagePercentage != null)
              _Row('Wastage %', '${bom.wastagePercentage!.toStringAsFixed(1)}%'),
            if (bom.createdAt != null)
              _Row('Created', Formatters.dateTime(bom.createdAt!)),
          ],
        )),
        if (bom.items.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          UiCard(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              UiSectionHeader(title: 'Items (${bom.items.length})'),
              ...bom.items.map((item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
                child: Row(children: [
                  Expanded(child: Text(item.productName)),
                  Text(item.quantity.toStringAsFixed(2)),
                  if (item.rate != null) ...[
                    const SizedBox(width: Spacing.x2),
                    Text('\$${item.rate!.toStringAsFixed(2)}'),
                  ],
                ]),
              )),
            ],
          )),
        ],
      ],
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'ACTIVE' => UiTone.success,
        'DRAFT' => UiTone.neutral,
        'ARCHIVED' => UiTone.neutral,
        'OBSOLETE' => UiTone.danger,
        _ => UiTone.neutral,
      };
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
      ]),
    );
  }
}
