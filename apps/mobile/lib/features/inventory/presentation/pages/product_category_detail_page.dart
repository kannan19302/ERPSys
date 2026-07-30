import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/inventory.dart';
import '../providers/inventory_providers.dart';

class ProductCategoryDetailPage extends ConsumerWidget {
  const ProductCategoryDetailPage({required this.categoryId, super.key});

  static const String routeName = 'product-category-detail';
  static const String routePath = '/inventory/categories/:id';

  final String categoryId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<ProductCategory> categoryAsync =
        ref.watch(productCategoryDetailProvider(categoryId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Category'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit category',
              onPressed: () => Navigator.of(context).pushNamed(
                'product-category-edit',
//                 pathParameters: <String, String>{'id': categoryId},
              ),
            ),
          ),
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete category',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: categoryAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load category.'),
          onRetry: () =>
              ref.invalidate(productCategoryDetailProvider(categoryId)),
        ),
        data: (ProductCategory category) =>
            _CategoryDetail(category: category),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete category?'),
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
        .read(productCategoryListControllerProvider.notifier)
        .delete(categoryId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _CategoryDetail extends StatelessWidget {
  const _CategoryDetail({required this.category});

  final ProductCategory category;

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
                      category.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(
                    label: category.isActive ? 'Active' : 'Inactive',
                    tone: category.isActive ? UiTone.success : UiTone.neutral,
                  ),
                ],
              ),
              if (category.description != null &&
                  category.description!.isNotEmpty) ...<Widget>[
                const SizedBox(height: Spacing.x3),
                Text(category.description!),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Details'),
              _Row('Parent Category', category.parentId ?? '— (top level)'),
              if (category.createdAt != null)
                _Row('Created', Formatters.dateTime(category.createdAt!)),
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
