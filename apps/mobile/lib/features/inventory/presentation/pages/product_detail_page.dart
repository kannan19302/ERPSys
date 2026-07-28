import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/product.dart';
import '../providers/inventory_providers.dart';

/// `GET /inventory/products/:id`. Read-only for now — editing reuses the same
/// form the create flow will use once Builder-driven forms land for mobile
/// (AGENTS.md Rule 31 keeps field layout out of hand-rolled screens).
class ProductDetailPage extends ConsumerWidget {
  const ProductDetailPage({required this.productId, super.key});

  static const String routeName = 'product-detail';
  static const String routePath = '/inventory/products/:id';

  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Product> productAsync =
        ref.watch(productDetailProvider(productId));

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
          onRetry: () => ref.invalidate(productDetailProvider(productId)),
        ),
        data: (Product product) => _ProductDetail(product: product),
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
        .read(productListControllerProvider.notifier)
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

  final Product product;

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
                      product.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: product.isActive ? 'Active' : 'Inactive',
                    tone: product.isActive ? UiTone.success : UiTone.neutral,
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x1),
              Text('SKU ${product.sku}', style: TextStyle(color: t.textSecondary)),
              if (product.description != null &&
                  product.description!.isNotEmpty) ...<Widget>[
                const SizedBox(height: Spacing.x3),
                Text(product.description!),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Pricing'),
              _Row('Cost price', Formatters.currency(product.costPrice)),
              _Row('Sell price', Formatters.currency(product.sellPrice)),
              _Row(
                'Margin',
                product.marginPercent == null
                    ? '—'
                    : Formatters.percent(product.marginPercent!),
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
              _Row('Type', product.type),
              _Row('Category', product.category ?? '—'),
              _Row('Unit', product.unit),
              _Row('Brand', product.brand ?? '—'),
              _Row('Barcode', product.barcode ?? '—'),
              if (product.updatedAt != null)
                _Row('Updated', Formatters.dateTime(product.updatedAt!)),
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
