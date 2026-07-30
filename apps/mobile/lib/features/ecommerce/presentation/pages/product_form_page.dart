import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/ecommerce.dart';
import '../providers/ecommerce_providers.dart';

class EcommerceProductFormPage extends ConsumerStatefulWidget {
  const EcommerceProductFormPage({this.productId, super.key});

  static const String routeName = 'ecommerce-product-new';
  static const String routeEditName = 'ecommerce-product-edit';
  static const String routePath = '/ecommerce/products/new';
  static const String routeEditPath = '/ecommerce/products/:id/edit';

  final String? productId;

  @override
  ConsumerState<EcommerceProductFormPage> createState() => _EcommerceProductFormPageState();
}

class _EcommerceProductFormPageState extends ConsumerState<EcommerceProductFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _descriptionCtrl = TextEditingController();
  final TextEditingController _priceCtrl = TextEditingController();
  final TextEditingController _comparePriceCtrl = TextEditingController();
  final TextEditingController _skuCtrl = TextEditingController();
  final TextEditingController _inventoryCtrl = TextEditingController();
  final TextEditingController _categoryIdCtrl = TextEditingController();
  final TextEditingController _currencyCtrl = TextEditingController();

  String _status = 'ACTIVE';
  bool _saving = false;

  bool get _isEditing => widget.productId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadProduct();
    }
  }

  Future<void> _loadProduct() async {
    final EcommerceProduct? product = ref
        .read(ecommerceProductDetailProvider(widget.productId!))
        .valueOrNull;
    if (product != null) {
      _nameCtrl.text = product.name;
      _descriptionCtrl.text = product.description ?? '';
      _priceCtrl.text = product.price.toString();
      _comparePriceCtrl.text = product.comparePrice?.toString() ?? '';
      _skuCtrl.text = product.sku ?? '';
      _inventoryCtrl.text = product.inventory.toString();
      _categoryIdCtrl.text = product.categoryId ?? '';
      _currencyCtrl.text = product.currency;
      _status = product.status;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    _priceCtrl.dispose();
    _comparePriceCtrl.dispose();
    _skuCtrl.dispose();
    _inventoryCtrl.dispose();
    _categoryIdCtrl.dispose();
    _currencyCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'price': double.tryParse(_priceCtrl.text) ?? 0,
      'comparePrice': double.tryParse(_comparePriceCtrl.text),
      'sku': _skuCtrl.text.trim().isEmpty ? null : _skuCtrl.text.trim(),
      'inventory': int.tryParse(_inventoryCtrl.text) ?? 0,
      'categoryId': _categoryIdCtrl.text.trim().isEmpty ? null : _categoryIdCtrl.text.trim(),
      'currency': _currencyCtrl.text.trim().isEmpty ? 'USD' : _currencyCtrl.text.trim(),
      'status': _status,
    };

    final Result<EcommerceProduct> result = await ref
        .read(ecommerceProductListControllerProvider.notifier)
        .save(payload, id: widget.productId);

    if (!context.mounted) return;
    setState(() => _saving = false);

    result.fold(
      (Failure failure) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(failure.message)));
      },
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Product' : 'New Product'),
        actions: <Widget>[
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: Spacing.x5,
                    width: Spacing.x5,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: <Widget>[
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Name *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _descriptionCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _priceCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Price *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _comparePriceCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Compare Price'),
            ),
            const SizedBox(height: Spacing.x4),
            Row(
              children: <Widget>[
                Expanded(
                  child: TextFormField(
                    controller: _skuCtrl,
                    decoration: const InputDecoration(labelText: 'SKU'),
                  ),
                ),
                const SizedBox(width: Spacing.x4),
                Expanded(
                  child: TextFormField(
                    controller: _currencyCtrl,
                    decoration: const InputDecoration(labelText: 'Currency'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _inventoryCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Inventory'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _categoryIdCtrl,
              decoration: const InputDecoration(labelText: 'Category ID'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem<String>(value: 'INACTIVE', child: Text('Inactive')),
                DropdownMenuItem<String>(value: 'DRAFT', child: Text('Draft')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
          ],
        ),
      ),
    );
  }
}