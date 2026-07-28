import 'package:flutter/material.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/product.dart';

/// One row of the product list. The mobile equivalent of a `DataTable` row —
/// the same fields, laid out for a narrow viewport instead of columns.
class ProductTile extends StatelessWidget {
  const ProductTile({required this.product, this.onTap, super.key});

  final Product product;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          Container(
            height: Spacing.x10,
            width: Spacing.x10,
            decoration: BoxDecoration(
              color: t.bgSunken,
              borderRadius: Radii.control,
            ),
            alignment: Alignment.center,
            child: Icon(
              _iconForType(product.type),
              size: TypeScale.xl,
              color: t.textSecondary,
            ),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  product.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  product.sku,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: t.textTertiary,
                    fontSize: TypeScale.xs,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.x2),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: <Widget>[
              Text(
                Formatters.currency(product.sellPrice),
                style: Theme.of(context).textTheme.labelLarge,
              ),
              const SizedBox(height: Spacing.x1),
              UiStatusBadge(
                label: product.isActive ? 'Active' : 'Inactive',
                tone: product.isActive ? UiTone.success : UiTone.neutral,
              ),
            ],
          ),
        ],
      ),
    );
  }

  static IconData _iconForType(String type) => switch (type) {
        'SERVICE' => Icons.handyman_outlined,
        'RAW_MATERIAL' => Icons.grain_outlined,
        'FINISHED_GOOD' => Icons.inventory_2_outlined,
        'SEMI_FINISHED' => Icons.construction_outlined,
        'CONSUMABLE' => Icons.local_drink_outlined,
        'ASSET' => Icons.precision_manufacturing_outlined,
        _ => Icons.category_outlined,
      };
}
