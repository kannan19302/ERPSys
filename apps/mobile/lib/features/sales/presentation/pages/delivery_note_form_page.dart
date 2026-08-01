import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';

class DeliveryNoteFormPage extends ConsumerStatefulWidget {
  const DeliveryNoteFormPage({this.deliveryNoteId, super.key});

  static const String routeName = 'delivery-note-new';
  static const String routePath = '/sales/delivery-notes/new';

  final String? deliveryNoteId;

  @override
  ConsumerState<DeliveryNoteFormPage> createState() => _DeliveryNoteFormPageState();
}

class _DeliveryNoteFormPageState extends ConsumerState<DeliveryNoteFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _customerCtrl = TextEditingController();
  final TextEditingController _salesOrderCtrl = TextEditingController();
  final TextEditingController _shippingCtrl = TextEditingController();
  final TextEditingController _notesCtrl = TextEditingController();

  DateTime? _deliveryDate;
  bool _saving = false;

  final List<_LineItem> _items = <_LineItem>[];

  @override
  void dispose() {
    _customerCtrl.dispose();
    _salesOrderCtrl.dispose();
    _shippingCtrl.dispose();
    _notesCtrl.dispose();
    for (final _LineItem item in _items) {
      item.productCtrl.dispose();
      item.qtyCtrl.dispose();
    }
    super.dispose();
  }

  void _addItem() {
    setState(() {
      _items.add(_LineItem(
        productCtrl: TextEditingController(),
        qtyCtrl: TextEditingController(text: '1'),
      ),);
    });
  }

  void _removeItem(int index) {
    setState(() {
      _items[index].productCtrl.dispose();
      _items[index].qtyCtrl.dispose();
      _items.removeAt(index);
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'customerName': _customerCtrl.text.trim(),
      'salesOrderId': _salesOrderCtrl.text.trim().isEmpty ? null : _salesOrderCtrl.text.trim(),
      'shippingAddress': _shippingCtrl.text.trim().isEmpty ? null : _shippingCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      if (_deliveryDate != null) 'deliveryDate': _deliveryDate!.toIso8601String(),
      'items': _items.map((_LineItem item) => <String, dynamic>{
        'productName': item.productCtrl.text.trim(),
        'quantity': double.tryParse(item.qtyCtrl.text) ?? 1,
      },).toList(),
    };

    final Result<DeliveryNote> result = await ref
        .read(deliveryNotesProvider.notifier)
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

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _deliveryDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _deliveryDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Delivery Note'),
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
              controller: _customerCtrl,
              decoration: const InputDecoration(labelText: 'Customer *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _salesOrderCtrl,
              decoration: const InputDecoration(
                labelText: 'Sales Order (optional)',
                helperText: 'Reference sales order ID',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: _selectDate,
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Delivery Date',
                  suffixIcon: Icon(Icons.calendar_today_outlined),
                ),
                child: Text(
                  _deliveryDate != null
                      ? '${_deliveryDate!.toLocal()}'.split(' ')[0]
                      : 'Select date',
                ),
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _shippingCtrl,
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Shipping Address',
                alignLabelWithHint: true,
              ),
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
              (MapEntry<int, _LineItem> entry) => _buildItemRow(entry.key, entry.value),
            ),
            if (_items.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: Spacing.x6),
                child: Center(
                  child: Text(
                    'No items added yet',
                    style: TextStyle(color: context.tokens.textTertiary),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildItemRow(int index, _LineItem item) {
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
                    width: Spacing.x16,
                    child: TextFormField(
                      controller: item.qtyCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Qty',
                        isDense: true,
                      ),
                      keyboardType: TextInputType.number,
                      validator: (String? v) =>
                          v == null || v.trim().isEmpty ? 'Req' : null,
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

class _LineItem {
  _LineItem({required this.productCtrl, required this.qtyCtrl});

  final TextEditingController productCtrl;
  final TextEditingController qtyCtrl;
}
