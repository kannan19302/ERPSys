import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';

class SalesOrderFormPage extends ConsumerStatefulWidget {
  const SalesOrderFormPage({this.orderId, super.key});

  static const String routeName = 'sales-order-new';
  static const String routeEditName = 'sales-order-edit';
  static const String routePath = '/sales/orders/new';
  static const String routeEditPath = '/sales/orders/:id/edit';

  final String? orderId;

  @override
  ConsumerState<SalesOrderFormPage> createState() => _SalesOrderFormPageState();
}

class _SalesOrderFormPageState extends ConsumerState<SalesOrderFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _customerCtrl = TextEditingController();
  final TextEditingController _shippingCtrl = TextEditingController();
  final TextEditingController _notesCtrl = TextEditingController();
  final TextEditingController _termsCtrl = TextEditingController();

  DateTime? _orderDate;
  bool _saving = false;

  final List<_OrderLineItem> _items = <_OrderLineItem>[];

  bool get _isEditing => widget.orderId != null;

  @override
  void initState() {
    super.initState();
    _orderDate = DateTime.now();
    if (_isEditing) {
      _loadOrder();
    }
  }

  Future<void> _loadOrder() async {
    final SalesOrder? order = ref
        .read(salesOrderDetailProvider(widget.orderId!))
        .valueOrNull;
    if (order != null) {
      _customerCtrl.text = order.customerName;
      _notesCtrl.text = order.notes ?? '';
      _orderDate = order.createdAt ?? DateTime.now();
      for (final SalesOrderItem item in order.items) {
        _items.add(_OrderLineItem(
          productCtrl: TextEditingController(text: item.productName),
          qtyCtrl: TextEditingController(text: item.quantity.toString()),
          rateCtrl: TextEditingController(text: item.rate.toString()),
        ));
      }
    }
  }

  @override
  void dispose() {
    _customerCtrl.dispose();
    _shippingCtrl.dispose();
    _notesCtrl.dispose();
    _termsCtrl.dispose();
    for (final _OrderLineItem item in _items) {
      item.productCtrl.dispose();
      item.qtyCtrl.dispose();
      item.rateCtrl.dispose();
    }
    super.dispose();
  }

  void _addItem() {
    setState(() {
      _items.add(_OrderLineItem(
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

  double get _totalAmount {
    double total = 0;
    for (final _OrderLineItem item in _items) {
      final double qty = double.tryParse(item.qtyCtrl.text) ?? 0;
      final double rate = double.tryParse(item.rateCtrl.text) ?? 0;
      total += qty * rate;
    }
    return total;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'customerName': _customerCtrl.text.trim(),
      'orderDate': _orderDate?.toIso8601String(),
      'shippingAddress': _shippingCtrl.text.trim().isEmpty ? null : _shippingCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'terms': _termsCtrl.text.trim().isEmpty ? null : _termsCtrl.text.trim(),
      'items': _items.map((_OrderLineItem item) => <String, dynamic>{
        'productName': item.productCtrl.text.trim(),
        'quantity': double.tryParse(item.qtyCtrl.text) ?? 1,
        'rate': double.tryParse(item.rateCtrl.text) ?? 0,
        'amount': (double.tryParse(item.qtyCtrl.text) ?? 0) * (double.tryParse(item.rateCtrl.text) ?? 0),
      }).toList(),
      'totalAmount': _totalAmount,
    };

    final Result<SalesOrder> result = await ref
        .read(salesOrdersProvider.notifier)
        .save(payload, id: widget.orderId);

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
        title: Text(_isEditing ? 'Edit Sales Order' : 'New Sales Order'),
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
            InkWell(
              onTap: () async {
                final DateTime? picked = await showDatePicker(
                  context: context,
                  initialDate: _orderDate ?? DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2030),
                );
                if (picked != null) setState(() => _orderDate = picked);
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Order Date',
                  suffixIcon: Icon(Icons.calendar_today_outlined),
                ),
                child: Text(
                  _orderDate != null
                      ? Formatters.date(_orderDate!)
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
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Notes',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _termsCtrl,
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Terms & Conditions',
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
              (MapEntry<int, _OrderLineItem> entry) =>
                  _buildItemRow(entry.key, entry.value),
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
            if (_items.isNotEmpty) ...[
              const Divider(),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: Spacing.x2),
                child: Row(
                  children: <Widget>[
                    const Text('Total',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    const Spacer(),
                    Text(
                      Formatters.currency(_totalAmount),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: TypeScale.lg,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildItemRow(int index, _OrderLineItem item) {
    final double qty = double.tryParse(item.qtyCtrl.text) ?? 0;
    final double rate = double.tryParse(item.rateCtrl.text) ?? 0;
    final double amount = qty * rate;

    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.x3),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    flex: 3,
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
                      onChanged: (_) => setState(() {}),
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
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline),
                    color: context.tokens.danger,
                    onPressed: () => _removeItem(index),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x1),
              Text(
                'Amount: ${Formatters.currency(amount)}',
                style: TextStyle(
                  fontSize: TypeScale.xs,
                  color: context.tokens.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderLineItem {
  _OrderLineItem({
    required this.productCtrl,
    required this.qtyCtrl,
    required this.rateCtrl,
  });

  final TextEditingController productCtrl;
  final TextEditingController qtyCtrl;
  final TextEditingController rateCtrl;
}
