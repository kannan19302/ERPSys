import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../domain/entities/real_estate.dart';
import '../providers/real_estate_providers.dart';

class PropertyDetailPage extends ConsumerWidget {
  const PropertyDetailPage({required this.propertyId, super.key});
  static const String routeName = 'property-detail';
  static const String routePath = '/real-estate/properties/:id';
  final String propertyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(propertyDetailProvider(propertyId));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Property'),
        actions: [PermissionGate(permission: Permissions.realEstateDelete, child: IconButton(
          icon: const Icon(Icons.delete_outline), tooltip: 'Delete property',
          onPressed: () async {
            final confirmed = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
              title: const Text('Delete property?'), content: const Text('This cannot be undone.'),
              actions: [TextButton(onPressed: () => Navigator.of(c).pop(false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.of(c).pop(true), child: const Text('Delete')),],
            ),);
            if (confirmed != true || !context.mounted) return;
            final r = await ref.read(propertyListControllerProvider.notifier).delete(propertyId);
            if (!context.mounted) return;
            r.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
          },
        ),),],
      ),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(failure: e is Failure ? e : const ServerFailure('Could not load property.'), onRetry: () => ref.invalidate(propertyDetailProvider(propertyId))),
        data: (p) => _PropertyDetail(property: p),
      ),
    );
  }
}

class _PropertyDetail extends StatelessWidget {
  const _PropertyDetail({required this.property});
  final Property property;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final (label, color, bg) = switch (property.status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'INACTIVE' => ('Inactive', t.textSecondary, t.bgSunken),
      'MAINTENANCE' => ('Maintenance', t.warning, t.warningLight),
      _ => ('Unknown', t.warning, t.warningLight),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.business, color: t.primary, size: 40),
            const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(property.name, style: Theme.of(context).textTheme.titleLarge),
              Text('${property.totalUnits} units', style: TextStyle(color: t.textSecondary)),
            ],),),
            Container(padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
              decoration: BoxDecoration(color: bg, borderRadius: Radii.pill),
              child: Text(label, style: TextStyle(color: color, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),),
          ],),
          if (property.description != null && property.description!.isNotEmpty) Padding(padding: const EdgeInsets.only(top: Spacing.x2), child: Text(property.description!, style: TextStyle(color: t.textSecondary))),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Location'),
          _FieldRow('Address', property.address ?? '—'), _FieldRow('City', property.city ?? '—'),
          _FieldRow('State', property.state ?? '—'), _FieldRow('Zip', property.zipCode ?? '—'), _FieldRow('Country', property.country),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Units & Area'),
          _FieldRow('Total Units', '${property.totalUnits}'), _FieldRow('Occupied Units', '${property.occupiedUnits}'),
          _FieldRow('Occupancy Rate', '${property.occupancyRate.toStringAsFixed(1)}%'),
          _FieldRow('Total Area', '${property.totalArea} ${property.areaUnit}'),
        ],),),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Financials'),
          _FieldRow('Property Type', property.propertyType),
          if (property.purchasePrice != null) _FieldRow('Purchase Price', Formatters.currency(property.purchasePrice!)),
          if (property.currentValue != null) _FieldRow('Current Value', Formatters.currency(property.currentValue!)),
        ],),),
        if (property.amenities.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const _SectionTitle(title: 'Amenities'),
            Wrap(spacing: Spacing.x1, runSpacing: Spacing.x1,
              children: property.amenities.map((a) => Chip(label: Text(a, style: const TextStyle(fontSize: TypeScale.xs)), materialTapTargetSize: MaterialTapTargetSize.shrinkWrap)).toList(),),
          ],),),
        ],
      ],
    );
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