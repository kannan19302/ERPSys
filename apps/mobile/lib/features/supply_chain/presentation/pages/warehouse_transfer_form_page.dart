import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../providers/supply_chain_providers.dart';

class WarehouseTransferFormPage extends ConsumerStatefulWidget {
  const WarehouseTransferFormPage({super.key});
  static const String routeName = 'warehouse-transfer-new';
  static const String routePath = '/supply-chain/warehouse-transfers/new';
  @override
  ConsumerState<WarehouseTransferFormPage> createState() => _WarehouseTransferFormPageState();
}

class _WarehouseTransferFormPageState extends ConsumerState<WarehouseTransferFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _fromWarehouseIdCtrl = TextEditingController();
  final _fromWarehouseNameCtrl = TextEditingController();
  final _toWarehouseIdCtrl = TextEditingController();
  final _toWarehouseNameCtrl = TextEditingController();
  final _productIdCtrl = TextEditingController();
  final _productNameCtrl = TextEditingController();
  final _quantityCtrl = TextEditingController();
  final _referenceCtrl = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _fromWarehouseIdCtrl.dispose();
    _fromWarehouseNameCtrl.dispose();
    _toWarehouseIdCtrl.dispose();
    _toWarehouseNameCtrl.dispose();
    _productIdCtrl.dispose();
    _productNameCtrl.dispose();
    _quantityCtrl.dispose();
    _referenceCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'fromWarehouseId': _fromWarehouseIdCtrl.text.trim().isEmpty ? null : _fromWarehouseIdCtrl.text.trim(),
      'fromWarehouseName': _fromWarehouseNameCtrl.text.trim().isEmpty ? null : _fromWarehouseNameCtrl.text.trim(),
      'toWarehouseId': _toWarehouseIdCtrl.text.trim().isEmpty ? null : _toWarehouseIdCtrl.text.trim(),
      'toWarehouseName': _toWarehouseNameCtrl.text.trim().isEmpty ? null : _toWarehouseNameCtrl.text.trim(),
      'productId': _productIdCtrl.text.trim().isEmpty ? null : _productIdCtrl.text.trim(),
      'productName': _productNameCtrl.text.trim().isEmpty ? null : _productNameCtrl.text.trim(),
      'quantity': double.tryParse(_quantityCtrl.text) ?? 0,
      'reference': _referenceCtrl.text.trim().isEmpty ? null : _referenceCtrl.text.trim(),
      'status': 'PENDING',
    };

    final result = await ref.read(warehouseTransferListControllerProvider.notifier).save(payload);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (Failure f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Warehouse Transfer'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: [
            TextFormField(
              controller: _fromWarehouseIdCtrl,
              decoration: const InputDecoration(labelText: 'From Warehouse ID'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _fromWarehouseNameCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'From Warehouse Name'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _toWarehouseIdCtrl,
              decoration: const InputDecoration(labelText: 'To Warehouse ID'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _toWarehouseNameCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'To Warehouse Name'),
            ),
            const SizedBox(height: Spacing.x4),
            Row(children: [
              Expanded(
                child: TextFormField(
                  controller: _productIdCtrl,
                  decoration: const InputDecoration(labelText: 'Product ID'),
                ),
              ),
              const SizedBox(width: Spacing.x4),
              Expanded(
                child: TextFormField(
                  controller: _productNameCtrl,
                  decoration: const InputDecoration(labelText: 'Product Name'),
                ),
              ),
            ]),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _quantityCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Quantity *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _referenceCtrl,
              decoration: const InputDecoration(labelText: 'Reference'),
            ),
          ],
        ),
      ),
    );
  }
}