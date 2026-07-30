import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../providers/procurement_providers.dart';

class PurchaseReceiptFormPage extends ConsumerStatefulWidget {
  const PurchaseReceiptFormPage({this.receiptId, super.key});
  static const String routeName = 'purchase-receipt-new';
  static const String routeEditName = 'purchase-receipt-edit';
  static const String routePath = '/procurement/purchase-receipts/new';
  static const String routeEditPath = '/procurement/purchase-receipts/:id/edit';
  final String? receiptId;

  @override
  ConsumerState<PurchaseReceiptFormPage> createState() => _PurchaseReceiptFormPageState();
}

class _PurchaseReceiptFormPageState extends ConsumerState<PurchaseReceiptFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _poRefCtrl = TextEditingController();
  final _warehouseCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _items = <_PRLineItem>[];
  bool _saving = false;

  bool get _isEditing => widget.receiptId != null;

  @override
  void initState() { super.initState(); _addItem(); }

  void _addItem() {
    setState(() => _items.add(_PRLineItem(
      productCtrl: TextEditingController(),
      receivedCtrl: TextEditingController(text: '0'),
      acceptedCtrl: TextEditingController(text: '0'),
    )));
  }

  void _removeItem(int index) {
    if (_items.length > 1) { _items[index].dispose(); setState(() => _items.removeAt(index)); }
  }

  @override
  void dispose() {
    _poRefCtrl.dispose(); _warehouseCtrl.dispose(); _dateCtrl.dispose(); _notesCtrl.dispose();
    for (final i in _items) i.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'purchaseOrderId': _poRefCtrl.text.trim(),
      'warehouseName': _warehouseCtrl.text.trim().isEmpty ? null : _warehouseCtrl.text.trim(),
      'receivedDate': _dateCtrl.text.trim().isEmpty ? null : _dateCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'items': _items.map((i) => <String, dynamic>{
        'productName': i.productCtrl.text.trim(),
        'receivedQuantity': double.tryParse(i.receivedCtrl.text) ?? 0,
        'acceptedQuantity': double.tryParse(i.acceptedCtrl.text) ?? 0,
      }).toList(),
    };

    final result = await ref.read(purchaseReceiptListControllerProvider.notifier)
        .save(payload, id: widget.receiptId);

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
        title: Text(_isEditing ? 'Edit Receipt' : 'New Receipt'),
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
              controller: _poRefCtrl,
              decoration: const InputDecoration(labelText: 'Purchase Order Reference'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _warehouseCtrl,
              decoration: const InputDecoration(labelText: 'Warehouse'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _dateCtrl,
              decoration: const InputDecoration(labelText: 'Received Date'),
            ),
            const SizedBox(height: Spacing.x4),
            Row(children: [
              const Text('Items', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const Spacer(),
              TextButton.icon(
                onPressed: _addItem, icon: const Icon(Icons.add, size: 18), label: const Text('Add'),
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
                    controller: item.receivedCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Received', isDense: true),
                  )),
                  const SizedBox(width: Spacing.x2),
                  Expanded(flex: 1, child: TextFormField(
                    controller: item.acceptedCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Accepted', isDense: true),
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
              controller: _notesCtrl, maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Notes', alignLabelWithHint: true),
            ),
          ],
        ),
      ),
    );
  }
}

class _PRLineItem {
  _PRLineItem({
    required this.productCtrl, required this.receivedCtrl, required this.acceptedCtrl,
  });
  final TextEditingController productCtrl;
  final TextEditingController receivedCtrl;
  final TextEditingController acceptedCtrl;
  void dispose() { productCtrl.dispose(); receivedCtrl.dispose(); acceptedCtrl.dispose(); }
}