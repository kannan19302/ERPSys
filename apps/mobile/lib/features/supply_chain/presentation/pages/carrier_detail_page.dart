import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/supply_chain.dart';
import '../providers/supply_chain_providers.dart';

/// `GET /supply-chain/carriers/:id`. Read-only.
class CarrierDetailPage extends ConsumerWidget {
  const CarrierDetailPage({required this.carrierId, super.key});

  static const String routeName = 'carrier-detail';

  final String carrierId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Carrier> carrierAsync =
        ref.watch(carrierDetailProvider(carrierId));

    return Scaffold(
      appBar: AppBar(title: const Text('Carrier')),
      body: carrierAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load carrier.'),
          onRetry: () => ref.invalidate(carrierDetailProvider(carrierId)),
        ),
        data: (Carrier carrier) => _CarrierDetail(carrier: carrier),
      ),
    );
  }
}

class _CarrierDetail extends StatelessWidget {
  const _CarrierDetail({required this.carrier});

  final Carrier carrier;

  @override
  Widget build(BuildContext context) {
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
                      carrier.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: carrier.isActive ? 'Active' : 'Inactive',
                    tone: carrier.isActive ? UiTone.success : UiTone.neutral,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Contact'),
              _Row('Phone', carrier.phone ?? '—'),
              _Row('Email', carrier.email ?? '—'),
              _Row('Tracking URL', carrier.trackingUrl ?? '—'),
            ],
          ),
        ),
      ],
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
