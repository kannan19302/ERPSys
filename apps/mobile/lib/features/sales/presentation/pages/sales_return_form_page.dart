import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';

class SalesReturnFormPage extends ConsumerStatefulWidget {
  const SalesReturnFormPage({super.key});

  static const String routeName = 'sales-return-new';
  static const String routePath = '/sales/returns/new';

  @override
  ConsumerState<SalesReturnFormPage> createState() => _SalesReturnFormPageState();
}

class _SalesReturnFormPageState extends ConsumerState<SalesReturnFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _salesOrderCtrl = TextEditingController();
  final TextEditingController _reasonCtrl = TextEditingController();
  final TextEditingController _notesCtrl = TextEditingController();

  String _reasonType = 'RETURN';
  bool _saving = false;

  final List<_ReturnLineItem> _items = <_ReturnLineItem>[];

  @override
  void dispose() {
    _salesOrderCtrl.dispose();
    _reasonCtrl.dispose();
    _notesCtrl.dispose();
    for (final _ReturnLineItem item in _items) {
      item.productCtrl.dispose();
      item.qtyCtrl.dispose();
      item.rateCtrl.dispose();
    }
    super.dispose();
  }

  void _addItem() {
    setState(() {
      _items.add(_ReturnLineItem(
        productCtrl: TextEditingController(),
        qtyCtrl: TextEditingController(text: '1'),
        rateCtrl: TextEditingController(),
      ));
    });
  }

  void _removeItem(int index) {
    setState(() {
      _items[index].productCtrl.dispose();
      _items[index].qtyCtrl.dispose();
      _items[index].rateCtrl.dispose();
      _items.removeAt(index);
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'salesOrderId': _salesOrderCtrl.text.trim(),
      'reason': _reasonCtrl.text.trim(),
      'reasonType': _reasonType,
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'items': _items.map((_ReturnLineItem item) => <String, dynamic>{
        'productName': item.productCtrl.text.trim(),
        'quantity': double.tryParse(item.qtyCtrl.text) ?? 1,
        'rate': double.tryParse(item.rateCtrl.text) ?? 0,
        'amount': (double.tryParse(item.qtyCtrl.text) ?? 0) * (double.tryParse(item.rateCtrl.text) ?? 0),
      }).toList(),
    };

    final Result<SalesReturn> result = await ref
        .read(salesReturnsProvider.notifier)
        .create(payload);

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
        title: const Text('New Sales Return'),
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
              controller: _salesOrderCtrl,
              decoration: const InputDecoration(labelText: 'Sales Order *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _reasonType,
              decoration: const InputDecoration(labelText: 'Return Type'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'RETURN', child: Text('Return')),
                DropdownMenuItem<String>(value: 'REFUND', child: Text('Refund')),
                DropdownMenuItem<String>(value: 'EXCHANGE', child: Text('Exchange')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _reasonType = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _reasonCtrl,
              decoration: const InputDecoration(labelText: 'Reason'),
              maxLines: 2,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Notes',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x6),
            Row(
              children: <Widget>[
                Text('Items', style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                TextButton.icon(
                  onPressed: _addItem,
                  icon: const Icon(Icons.add, size: TypeScale.lg),
                  label: const Text('Add item'),
                ),
              ],
            ),
            ..._items.asMap().entries.map(
              (MapEntry<int, _ReturnLineItem> entry) =>
                  _buildItemRow(entry.key, entry.value),
            ),
            if (_items.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: Spacing.x6),
                child: Center(
                  child: Text(
                    'Add items from the sales order',
                    style: TextStyle(color: context.tokens.textTertiary),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildItemRow(int index, _ReturnLineItem item) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.x3),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: TextFormField(
                      controller: item.productCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Product',
                        isDense: true,
                      ),
                      validator: (String? v) =>
                          v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: Spacing.x2),
                  SizedBox(
                    width: Spacing.x12,
                    child: TextFormField(
                      controller: item.qtyCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Qty',
                        isDense: true,
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  SizedBox(
                    width: Spacing.x12,
                    child: TextFormField(
                      controller: item.rateCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Rate',
                        isDense: true,
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline),
                    color: context.tokens.danger,
                    onPressed: () => _removeItem(index),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReturnLineItem {
  _ReturnLineItem({
    required this.productCtrl,
    required this.qtyCtrl,
    required this.rateCtrl,
  });

  final TextEditingController productCtrl;
  final TextEditingController qtyCtrl;
  final TextEditingController rateCtrl;
}
