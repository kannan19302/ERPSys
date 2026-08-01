import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../providers/procurement_providers.dart';

class PurchaseOrderFormPage extends ConsumerStatefulWidget {
  const PurchaseOrderFormPage({this.poId, super.key});
  static const String routeName = 'po-new';
  static const String routeEditName = 'po-edit';
  static const String routePath = '/procurement/purchase-orders/new';
  static const String routeEditPath = '/procurement/purchase-orders/:id/edit';
  final String? poId;

  @override
  ConsumerState<PurchaseOrderFormPage> createState() => _PurchaseOrderFormPageState();
}

class _PurchaseOrderFormPageState extends ConsumerState<PurchaseOrderFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _vendorCtrl = TextEditingController();
  final _orderDateCtrl = TextEditingController();
  final _deliveryDateCtrl = TextEditingController();
  final _shippingCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _termsCtrl = TextEditingController();
  final _items = <_POLineItem>[];
  bool _saving = false;

  bool get _isEditing => widget.poId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
    _addItem();
  }

  void _load() {
    final po = ref.read(purchaseOrderDetailProvider(widget.poId!)).valueOrNull;
    if (po != null) {
      _vendorCtrl.text = po.vendorName;
      _orderDateCtrl.text = po.orderDate?.toIso8601String() ?? '';
      _deliveryDateCtrl.text = po.expectedDate?.toIso8601String() ?? '';
      _shippingCtrl.text = po.shippingAddress ?? '';
      _notesCtrl.text = po.notes ?? '';
      _termsCtrl.text = po.terms ?? '';
      _items.clear();
      for (final item in po.items) {
        _items.add(_POLineItem(
          productCtrl: TextEditingController(text: item.productName ?? ''),
          qtyCtrl: TextEditingController(text: item.quantity.toString()),
          rateCtrl: TextEditingController(text: item.rate.toString()),
          taxCtrl: TextEditingController(text: item.taxRate.toString()),
        ),);
      }
      if (_items.isEmpty) _addItem();
    }
  }

  void _addItem() {
    setState(() => _items.add(_POLineItem(
      productCtrl: TextEditingController(),
      qtyCtrl: TextEditingController(text: '1'),
      rateCtrl: TextEditingController(),
      taxCtrl: TextEditingController(),
    ),),);
  }

  void _removeItem(int index) {
    if (_items.length > 1) {
      _items[index].dispose();
      setState(() => _items.removeAt(index));
    }
  }

  double get _subtotal {
    double s = 0;
    for (final item in _items) {
      final qty = double.tryParse(item.qtyCtrl.text) ?? 0;
      final rate = double.tryParse(item.rateCtrl.text) ?? 0;
      s += qty * rate;
    }
    return s;
  }

  @override
  void dispose() {
    _vendorCtrl.dispose(); _orderDateCtrl.dispose(); _deliveryDateCtrl.dispose();
    _shippingCtrl.dispose(); _notesCtrl.dispose(); _termsCtrl.dispose();
    for (final i in _items) {
      i.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'vendorName': _vendorCtrl.text.trim(),
      'orderDate': _orderDateCtrl.text.trim().isEmpty ? null : _orderDateCtrl.text.trim(),
      'expectedDate': _deliveryDateCtrl.text.trim().isEmpty ? null : _deliveryDateCtrl.text.trim(),
      'shippingAddress': _shippingCtrl.text.trim().isEmpty ? null : _shippingCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'terms': _termsCtrl.text.trim().isEmpty ? null : _termsCtrl.text.trim(),
      'subtotal': _subtotal,
      'items': _items.map((i) => <String, dynamic>{
        'productName': i.productCtrl.text.trim(),
        'quantity': double.tryParse(i.qtyCtrl.text) ?? 0,
        'rate': double.tryParse(i.rateCtrl.text) ?? 0,
        'taxRate': double.tryParse(i.taxCtrl.text) ?? 0,
      },).toList(),
    };

    final result = await ref.read(purchaseOrderListControllerProvider.notifier)
        .save(payload, id: widget.poId);

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
        title: Text(_isEditing ? 'Edit PO' : 'New Purchase Order'),
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
              controller: _vendorCtrl,
              decoration: const InputDecoration(labelText: 'Vendor *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _orderDateCtrl,
              decoration: const InputDecoration(labelText: 'Order Date'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _deliveryDateCtrl,
              decoration: const InputDecoration(labelText: 'Expected Delivery'),
            ),
            const SizedBox(height: Spacing.x4),
            Row(children: [
              const Text('Items', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const Spacer(),
              TextButton.icon(
                onPressed: _addItem, icon: const Icon(Icons.add, size: 18), label: const Text('Add'),
              ),
            ],),
            ...List.generate(_items.length, (i) {
              final item = _items[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: Spacing.x3),
                child: Row(children: [
                  Expanded(flex: 2, child: TextFormField(
                    controller: item.productCtrl,
                    decoration: const InputDecoration(labelText: 'Product', isDense: true),
                  ),),
                  const SizedBox(width: Spacing.x1),
                  Expanded(flex: 1, child: TextFormField(
                    controller: item.qtyCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Qty', isDense: true),
                  ),),
                  const SizedBox(width: Spacing.x1),
                  Expanded(flex: 1, child: TextFormField(
                    controller: item.rateCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Rate', isDense: true),
                  ),),
                  const SizedBox(width: Spacing.x1),
                  Expanded(flex: 1, child: TextFormField(
                    controller: item.taxCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Tax%', isDense: true),
                  ),),
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline, size: 20),
                    onPressed: () => _removeItem(i),
                  ),
                ],),
              );
            }),
            const SizedBox(height: Spacing.x2),
            Text('Subtotal: \$${_subtotal.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.labelLarge,),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _shippingCtrl,
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Shipping Address', alignLabelWithHint: true),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Notes', alignLabelWithHint: true),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _termsCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Terms', alignLabelWithHint: true),
            ),
          ],
        ),
      ),
    );
  }
}

class _POLineItem {
  _POLineItem({
    required this.productCtrl,
    required this.qtyCtrl,
    required this.rateCtrl,
    required this.taxCtrl,
  });

  final TextEditingController productCtrl;
  final TextEditingController qtyCtrl;
  final TextEditingController rateCtrl;
  final TextEditingController taxCtrl;

  void dispose() {
    productCtrl.dispose();
    qtyCtrl.dispose();
    rateCtrl.dispose();
    taxCtrl.dispose();
  }
}