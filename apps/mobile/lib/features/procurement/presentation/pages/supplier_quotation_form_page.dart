import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../providers/procurement_providers.dart';

class SupplierQuotationFormPage extends ConsumerStatefulWidget {
  const SupplierQuotationFormPage({this.quotationId, super.key});
  static const String routeName = 'supplier-quotation-new';
  static const String routeEditName = 'supplier-quotation-edit';
  static const String routePath = '/procurement/supplier-quotations/new';
  static const String routeEditPath = '/procurement/supplier-quotations/:id/edit';
  final String? quotationId;

  @override
  ConsumerState<SupplierQuotationFormPage> createState() => _SupplierQuotationFormPageState();
}

class _SupplierQuotationFormPageState extends ConsumerState<SupplierQuotationFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _rfqRefCtrl = TextEditingController();
  final _supplierCtrl = TextEditingController();
  final _validUntilCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _items = <_SQLineItem>[];
  bool _saving = false;

  bool get _isEditing => widget.quotationId != null;

  @override
  void initState() {
    super.initState();
    _addItem();
  }

  void _addItem() {
    setState(() => _items.add(_SQLineItem(
      productCtrl: TextEditingController(),
      qtyCtrl: TextEditingController(text: '1'),
      rateCtrl: TextEditingController(),
    )));
  }

  void _removeItem(int index) {
    if (_items.length > 1) {
      _items[index].dispose();
      setState(() => _items.removeAt(index));
    }
  }

  @override
  void dispose() {
    _rfqRefCtrl.dispose();
    _supplierCtrl.dispose();
    _validUntilCtrl.dispose();
    _notesCtrl.dispose();
    for (final i in _items) i.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'rfqNumber': _rfqRefCtrl.text.trim().isEmpty ? null : _rfqRefCtrl.text.trim(),
      'vendorName': _supplierCtrl.text.trim(),
      'validUntil': _validUntilCtrl.text.trim().isEmpty ? null : _validUntilCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'items': _items.map((i) => <String, dynamic>{
        'productName': i.productCtrl.text.trim(),
        'quantity': double.tryParse(i.qtyCtrl.text) ?? 0,
        'rate': double.tryParse(i.rateCtrl.text) ?? 0,
      }).toList(),
    };

    final result = await ref.read(supplierQuotationListControllerProvider.notifier)
        .save(payload, id: widget.quotationId);

    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Quotation' : 'New Quotation'),
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
              controller: _rfqRefCtrl,
              decoration: const InputDecoration(labelText: 'RFQ Reference'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _supplierCtrl,
              decoration: const InputDecoration(labelText: 'Supplier *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _validUntilCtrl,
              decoration: const InputDecoration(labelText: 'Valid Until'),
            ),
            const SizedBox(height: Spacing.x4),
            Row(children: [
              const Text('Items', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const Spacer(),
              TextButton.icon(
                onPressed: _addItem,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add'),
              ),
            ]),
            ...List.generate(_items.length, (i) {
              final item = _items[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: Spacing.x3),
                child: Row(children: [
                  Expanded(flex: 2, child: TextFormField(
                    controller: item.productCtrl,
                    decoration: const InputDecoration(labelText: 'Product', isDense: true),
                  )),
                  const SizedBox(width: Spacing.x2),
                  Expanded(flex: 1, child: TextFormField(
                    controller: item.qtyCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Qty', isDense: true),
                  )),
                  const SizedBox(width: Spacing.x2),
                  Expanded(flex: 1, child: TextFormField(
                    controller: item.rateCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Rate', isDense: true),
                  )),
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline, size: 20),
                    onPressed: () => _removeItem(i),
                  ),
                ]),
              );
            }),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Notes', alignLabelWithHint: true),
            ),
          ],
        ),
      ),
    );
  }
}

class _SQLineItem {
  _SQLineItem({
    required this.productCtrl,
    required this.qtyCtrl,
    required this.rateCtrl,
  });

  final TextEditingController productCtrl;
  final TextEditingController qtyCtrl;
  final TextEditingController rateCtrl;

  void dispose() {
    productCtrl.dispose();
    qtyCtrl.dispose();
    rateCtrl.dispose();
  }
}