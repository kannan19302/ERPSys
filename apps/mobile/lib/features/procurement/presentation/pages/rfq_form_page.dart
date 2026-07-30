import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class RFQFormPage extends ConsumerStatefulWidget {
  const RFQFormPage({this.rfqId, super.key});
  static const String routeName = 'rfq-new';
  static const String routeEditName = 'rfq-edit';
  static const String routePath = '/procurement/rfqs/new';
  static const String routeEditPath = '/procurement/rfqs/:id/edit';
  final String? rfqId;

  @override
  ConsumerState<RFQFormPage> createState() => _RFQFormPageState();
}

class _RFQFormPageState extends ConsumerState<RFQFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _vendorCtrl = TextEditingController();
  final _deliveryDateCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _items = <_RFQLineItem>[];
  bool _saving = false;

  bool get _isEditing => widget.rfqId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
    _addItem();
  }

  void _load() {
    final rfq = ref.read(rfqDetailProvider(widget.rfqId!)).valueOrNull;
    if (rfq != null) {
      _vendorCtrl.text = rfq.vendorName ?? '';
      _deliveryDateCtrl.text = rfq.deliveryDate?.toIso8601String() ?? '';
      _notesCtrl.text = rfq.notes ?? '';
      _items.clear();
      for (final item in rfq.items) {
        _items.add(_RFQLineItem(
          productNameCtrl: TextEditingController(text: item.productName ?? ''),
          qtyCtrl: TextEditingController(text: item.quantity.toString()),
          uomCtrl: TextEditingController(text: item.uom ?? ''),
        ));
      }
      if (_items.isEmpty) _addItem();
    }
  }

  void _addItem() {
    setState(() => _items.add(_RFQLineItem(
      productNameCtrl: TextEditingController(),
      qtyCtrl: TextEditingController(text: '1'),
      uomCtrl: TextEditingController(text: 'pcs'),
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
    _vendorCtrl.dispose();
    _deliveryDateCtrl.dispose();
    _notesCtrl.dispose();
    for (final item in _items) item.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'vendorName': _vendorCtrl.text.trim().isEmpty ? null : _vendorCtrl.text.trim(),
      'deliveryDate': _deliveryDateCtrl.text.trim().isEmpty ? null : _deliveryDateCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'items': _items.map((i) => <String, dynamic>{
        'productName': i.productNameCtrl.text.trim(),
        'quantity': double.tryParse(i.qtyCtrl.text) ?? 0,
        'uom': i.uomCtrl.text.trim(),
      }).toList(),
    };

    final result = await ref.read(rfqListControllerProvider.notifier)
        .save(payload, id: widget.rfqId);

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
        title: Text(_isEditing ? 'Edit RFQ' : 'New RFQ'),
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
              decoration: const InputDecoration(labelText: 'Vendor'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _deliveryDateCtrl,
              decoration: const InputDecoration(labelText: 'Delivery Date'),
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
            const SizedBox(height: Spacing.x2),
            ...List.generate(_items.length, (i) {
              final item = _items[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: Spacing.x3),
                child: Row(children: [
                  Expanded(flex: 3, child: TextFormField(
                    controller: item.productNameCtrl,
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
                    controller: item.uomCtrl,
                    decoration: const InputDecoration(labelText: 'UOM', isDense: true),
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

class _RFQLineItem {
  _RFQLineItem({
    required this.productNameCtrl,
    required this.qtyCtrl,
    required this.uomCtrl,
  });

  final TextEditingController productNameCtrl;
  final TextEditingController qtyCtrl;
  final TextEditingController uomCtrl;

  void dispose() {
    productNameCtrl.dispose();
    qtyCtrl.dispose();
    uomCtrl.dispose();
  }
}