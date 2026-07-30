import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/inventory.dart';
import '../../domain/usecases/inventory_usecases.dart';
import '../providers/inventory_providers.dart';

class ReorderRuleFormPage extends ConsumerStatefulWidget {
  const ReorderRuleFormPage({this.rule, super.key});

  static const String routeName = 'reorder-rule-new';
  static const String routeEditName = 'reorder-rule-edit';
  static const String routePath = '/inventory/reorder-rules/new';
  static const String routeEditPath = '/inventory/reorder-rules/:id/edit';

  final ReorderRule? rule;

  @override
  ConsumerState<ReorderRuleFormPage> createState() =>
      _ReorderRuleFormPageState();
}

class _ReorderRuleFormPageState extends ConsumerState<ReorderRuleFormPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _productIdCtrl;
  late final TextEditingController _warehouseIdCtrl;
  late final TextEditingController _minStockCtrl;
  late final TextEditingController _maxStockCtrl;
  late final TextEditingController _leadTimeCtrl;
  bool _isActive = true;
  bool _submitting = false;

  bool get _isEditing => widget.rule != null;

  @override
  void initState() {
    super.initState();
    final r = widget.rule;
    _productIdCtrl = TextEditingController(text: r?.productId ?? '');
    _warehouseIdCtrl = TextEditingController(text: r?.warehouseId ?? '');
    _minStockCtrl = TextEditingController(
      text: r != null ? r.minStock.toStringAsFixed(0) : '',
    );
    _maxStockCtrl = TextEditingController(
      text: r != null ? r.maxStock.toStringAsFixed(0) : '',
    );
    _leadTimeCtrl = TextEditingController(
      text: r != null ? r.leadTime.toString() : '',
    );
    _isActive = r?.isActive ?? true;
  }

  @override
  void dispose() {
    _productIdCtrl.dispose();
    _warehouseIdCtrl.dispose();
    _minStockCtrl.dispose();
    _maxStockCtrl.dispose();
    _leadTimeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Reorder Rule' : 'New Reorder Rule'),
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
            TextFormField(
              controller: _minStockCtrl,
              decoration: const InputDecoration(labelText: 'Min Stock *'),
              keyboardType: TextInputType.number,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _maxStockCtrl,
              decoration: const InputDecoration(labelText: 'Max Stock *'),
              keyboardType: TextInputType.number,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _leadTimeCtrl,
              decoration: const InputDecoration(
                labelText: 'Lead Time (days) *',
              ),
              keyboardType: TextInputType.number,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            SwitchListTile(
              title: const Text('Active'),
              value: _isActive,
              contentPadding: EdgeInsets.zero,
              onChanged: (v) => setState(() => _isActive = v),
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
                  : Text(_isEditing ? 'Save Changes' : 'Create Rule'),
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
      'minStock': double.tryParse(_minStockCtrl.text) ?? 0,
      'maxStock': double.tryParse(_maxStockCtrl.text) ?? 0,
      'leadTime': int.tryParse(_leadTimeCtrl.text) ?? 0,
      'isActive': _isActive,
    };

    final result = await SaveReorderRuleUseCase(
      ref.read(inventoryRepositoryProvider),
    )(
      SaveReorderRuleParams(
        payload: payload,
        id: _isEditing ? widget.rule!.id : null,
      ),
    );

    if (!context.mounted) return;
    setState(() => _submitting = false);

    result.fold(
      (Failure failure) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(failure.message)));
      },
      (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing
                ? 'Reorder rule updated'
                : 'Reorder rule created'),
          ),
        );
        Navigator.of(context).pop();
      },
    );
  }
}
