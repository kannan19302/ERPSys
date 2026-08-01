
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
  const BomDetailPage({super.key, this.id});
  final String? id;

  static const String routeName = 'bom-detail';
  static const String routePath = '/manufacturing/boms/:id';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String? bomId = id;
    if (bomId == null) {
      return const Scaffold(
        body: FailureView(failure: ServerFailure('Missing BOM id')),
      );
    }
    final AsyncValue<Bom> bomAsync = ref.watch(bomDetailProvider(bomId));

    return Scaffold(
      appBar: AppBar(title: const Text('Bill of Materials')),
      body: bomAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load BOM.'),
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
    final Palette t = context.tokens;
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      bom.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: bom.status,
                    tone: _statusTone(bom.status),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x1),
              Text(bom.productName, style: TextStyle(color: t.textSecondary)),
            ],
          ),
        ),
        if (bom.items.isNotEmpty) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          UiSectionHeader(title: 'Items (${bom.items.length})'),
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: bom.items.map((item) => _ItemRow(item: item)).toList(),
            ),
          ),
        ],
        const SizedBox(height: Spacing.x4),
        const UiSectionHeader(title: 'Details'),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Row('Type', bom.type),
              _Row('Quantity', bom.quantity.toStringAsFixed(2)),
              if (bom.wastagePercentage != null)
                _Row('Wastage %', Formatters.percent(bom.wastagePercentage!)),
            ],
          ),
        ),
      ],
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'DRAFT' => UiTone.neutral,
        'ACTIVE' => UiTone.success,
        'OBSOLETE' => UiTone.neutral,
        _ => UiTone.neutral,
      };
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({required this.item});
  final BomItem item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: [
          Expanded(child: Text(item.productName)),
          Text(item.quantity.toStringAsFixed(2)),
          if (item.rate != null) ...<Widget>[
            const SizedBox(width: Spacing.x2),
            Text(
              Formatters.currency(item.rate!),
              style: Theme.of(context).textTheme.labelLarge,
            ),
          ],
        ],
      ),
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
        children: [
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
