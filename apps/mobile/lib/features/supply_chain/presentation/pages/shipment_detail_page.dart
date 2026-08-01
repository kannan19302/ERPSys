import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/supply_chain.dart';
import '../providers/supply_chain_providers.dart';

/// `GET /supply-chain/shipments/:id`. Read-only.
class ShipmentDetailPage extends ConsumerWidget {
  const ShipmentDetailPage({required this.shipmentId, super.key});

  static const String routeName = 'shipment-detail';

  final String shipmentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Shipment> shipmentAsync =
        ref.watch(shipmentDetailProvider(shipmentId));

    return Scaffold(
      appBar: AppBar(title: const Text('Shipment')),
      body: shipmentAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load shipment.'),
          onRetry: () => ref.invalidate(shipmentDetailProvider(shipmentId)),
        ),
        data: (Shipment shipment) => _ShipmentDetail(shipment: shipment),
      ),
    );
  }
}

class _ShipmentDetail extends StatelessWidget {
  const _ShipmentDetail({required this.shipment});

  final Shipment shipment;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

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
                      shipment.shipmentNumber,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: shipment.status,
                    tone: _statusTone(shipment.status),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x1),
              Text(shipment.carrierName, style: TextStyle(color: t.textSecondary)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Route'),
              _Row('Origin', shipment.origin),
              _Row('Destination', shipment.destination),
              _Row(
                'Estimated delivery',
                shipment.estimatedDelivery == null
                    ? '—'
                    : Formatters.date(shipment.estimatedDelivery!),
              ),
              _Row(
                'Actual delivery',
                shipment.actualDelivery == null
                    ? '—'
                    : Formatters.date(shipment.actualDelivery!),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Details'),
              if (shipment.updatedAt != null)
                _Row('Updated', Formatters.dateTime(shipment.updatedAt!)),
            ],
          ),
        ),
      ],
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'PENDING' => UiTone.neutral,
        'IN_TRANSIT' => UiTone.info,
        'DELIVERED' => UiTone.success,
        'CANCELLED' => UiTone.danger,
        'DELAYED' => UiTone.warning,
        _ => UiTone.neutral,
      };
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
