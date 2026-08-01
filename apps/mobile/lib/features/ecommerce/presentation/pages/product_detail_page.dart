import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../domain/entities/ecommerce.dart';
import '../providers/ecommerce_providers.dart';

class EcommerceProductDetailPage extends ConsumerWidget {
  const EcommerceProductDetailPage({required this.productId, super.key});

  static const String routeName = 'ecommerce-product-detail';
  static const String routePath = '/ecommerce/products/:id';

  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<EcommerceProduct> productAsync =
        ref.watch(ecommerceProductDetailProvider(productId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Product'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete product',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: productAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load product.'),
          onRetry: () => ref.invalidate(ecommerceProductDetailProvider(productId)),
        ),
        data: (EcommerceProduct product) => _ProductDetail(product: product),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete product?'),
        content: const Text('This cannot be undone.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result = await ref
        .read(ecommerceProductListControllerProvider.notifier)
        .delete(productId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _ProductDetail extends StatelessWidget {
  const _ProductDetail({required this.product});

  final EcommerceProduct product;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(Spacing.x4),
          decoration: BoxDecoration(
            color: t.bgElevated,
            borderRadius: Radii.card,
            border: Border.all(color: t.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      product.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  _StatusPill(status: product.status, t: t),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              Text(
                Formatters.currency(product.price, currencyCode: product.currency),
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              if (product.comparePrice != null) ...<Widget>[
                Text(
                  'Was: ${Formatters.currency(product.comparePrice!, currencyCode: product.currency)}',
                  style: TextStyle(
                    color: t.textSecondary,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(Spacing.x4),
          decoration: BoxDecoration(
            color: t.bgElevated,
            borderRadius: Radii.card,
            border: Border.all(color: t.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Text('Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: Spacing.x3),
              _FieldRow('SKU', product.sku ?? '—'),
              _FieldRow('Category', product.categoryName ?? '—'),
              _FieldRow('Inventory', '${product.inventory} units'),
              _FieldRow('Rating', product.rating != null ? '${product.rating!.toStringAsFixed(1)} ★' : '—'),
              _FieldRow('Reviews', '${product.reviewCount}'),
            ],
          ),
        ),
        if (product.description != null && product.description!.isNotEmpty) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(Spacing.x4),
            decoration: BoxDecoration(
              color: t.bgElevated,
              borderRadius: Radii.card,
              border: Border.all(color: t.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const Text('Description', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: Spacing.x2),
                Text(product.description!),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status, required this.t});

  final String status;
  final Palette t;

  @override
  Widget build(BuildContext context) {
    final (String label, Color color, Color bg) = switch (status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'INACTIVE' => ('Inactive', t.textSecondary, t.bgSunken),
      'DRAFT' => ('Draft', t.warning, t.warningLight),
      _ => (status, t.textSecondary, t.bgSunken),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
      decoration: BoxDecoration(color: bg, borderRadius: Radii.pill),
      child: Text(label, style: TextStyle(color: color, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),
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
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}