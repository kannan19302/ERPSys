import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class VendorDetailPage extends ConsumerWidget {
  const VendorDetailPage({required this.vendorId, super.key});
  static const String routeName = 'vendor-detail';
  static const String routePath = '/procurement/vendors/:id';
  final String vendorId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(vendorDetailProvider(vendorId));

    return Scaffold(
      appBar: AppBar(title: const Text('Vendor')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load vendor.'),
          onRetry: () => ref.invalidate(vendorDetailProvider(vendorId)),
        ),
        data: (v) => _VendorDetail(vendor: v),
      ),
    );
  }
}

class _VendorDetail extends StatelessWidget {
  const _VendorDetail({required this.vendor});
  final Vendor vendor;

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
              Expanded(child: Text(vendor.name, style: Theme.of(context).textTheme.titleLarge)),
              UiStatusBadge(label: vendor.status, tone: _statusTone(vendor.status)),
            ]),
            if (vendor.email != null) ...[
              const SizedBox(height: Spacing.x1),
              Text(vendor.email!, style: TextStyle(color: t.textSecondary)),
            ],
          ],
        )),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Contact'),
            if (vendor.phone != null) _Row('Phone', vendor.phone!),
            if (vendor.email != null) _Row('Email', vendor.email!),
            if (vendor.taxId != null) _Row('Tax ID', vendor.taxId!),
            if (vendor.address != null) _Row('Address', vendor.address!),
          ],
        )),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Details'),
            _Row('Payment Terms', vendor.paymentTerms ?? '-'),
            _Row('Currency', vendor.currency),
            _Row('Total Purchases', Formatters.currency(vendor.totalPurchases)),
            if (vendor.rating != null) _Row('Rating', '${vendor.rating!.toStringAsFixed(1)} / 5'),
            if (vendor.bankDetails != null) _Row('Bank Details', vendor.bankDetails!),
          ],
        )),
        if (vendor.notes != null && vendor.notes!.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          UiCard(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const UiSectionHeader(title: 'Notes'),
              Text(vendor.notes!, style: TextStyle(color: t.textSecondary)),
            ],
          )),
        ],
        if (vendor.createdAt != null) ...[
          const SizedBox(height: Spacing.x4),
          UiCard(child: _Row('Created', Formatters.dateTime(vendor.createdAt!))),
        ],
      ],
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'ACTIVE' => UiTone.success, 'INACTIVE' => UiTone.neutral,
        'BLACKLISTED' => UiTone.danger, _ => UiTone.neutral,
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