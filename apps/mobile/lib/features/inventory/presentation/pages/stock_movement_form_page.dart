import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../domain/usecases/inventory_usecases.dart';
import '../providers/inventory_providers.dart';

class StockMovementFormPage extends ConsumerStatefulWidget {
  const StockMovementFormPage({super.key});

  static const String routeName = 'stock-movement-new';
  static const String routePath = '/inventory/stock-movements/new';

  @override
  ConsumerState<StockMovementFormPage> createState() =>
      _StockMovementFormPageState();
}

class _StockMovementFormPageState extends ConsumerState<StockMovementFormPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _productIdCtrl;
  late final TextEditingController _warehouseIdCtrl;
  late final TextEditingController _quantityCtrl;
  late final TextEditingController _referenceCtrl;
  late final TextEditingController _reasonCtrl;
  String _type = 'IN';
  bool _submitting = false;

  static const List<String> _types = ['IN', 'OUT', 'TRANSFER'];

  @override
  void initState() {
    super.initState();
    _productIdCtrl = TextEditingController();
    _warehouseIdCtrl = TextEditingController();
    _quantityCtrl = TextEditingController();
    _referenceCtrl = TextEditingController();
    _reasonCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _productIdCtrl.dispose();
    _warehouseIdCtrl.dispose();
    _quantityCtrl.dispose();
    _referenceCtrl.dispose();
    _reasonCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Stock Movement'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: <Widget>[
            TextFormField(
              controller: _productIdCtrl,
              decoration: const InputDecoration(labelText: 'Product ID *'),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _warehouseIdCtrl,
              decoration: const InputDecoration(labelText: 'Warehouse ID *'),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _type,
              decoration: const InputDecoration(labelText: 'Type *'),
              items: _types
                  .map(
                    (t) => DropdownMenuItem<String>(value: t, child: Text(t)),
                  )
                  .toList(),
              onChanged: (v) => setState(() => _type = v ?? 'IN'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _quantityCtrl,
              decoration: const InputDecoration(labelText: 'Quantity *'),
              keyboardType: TextInputType.number,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _referenceCtrl,
              decoration: const InputDecoration(labelText: 'Reference'),
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _reasonCtrl,
              decoration: const InputDecoration(labelText: 'Reason'),
              maxLines: 2,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x6),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      height: Spacing.x5,
                      width: Spacing.x5,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Create Movement'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);

    final payload = <String, dynamic>{
      'productId': _productIdCtrl.text.trim(),
      'warehouseId': _warehouseIdCtrl.text.trim(),
      'type': _type,
      'quantity': double.tryParse(_quantityCtrl.text) ?? 0,
      'reference': _referenceCtrl.text.trim(),
      'reason': _reasonCtrl.text.trim(),
    };

    final result = await CreateStockMovementUseCase(
      ref.read(inventoryRepositoryProvider),
    )(payload);

    if (!context.mounted) return;
    setState(() => _submitting = false);

    result.fold(
      (Failure failure) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(failure.message)));
      },
      (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Movement created')),
        );
        Navigator.of(context).pop();
      },
    );
  }
}
