import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';

class QuotationFormPage extends ConsumerStatefulWidget {
  const QuotationFormPage({this.quotationId, super.key});

  static const String routeName = 'quotation-new';
  static const String routeEditName = 'quotation-edit';
  static const String routePath = '/sales/quotations/new';
  static const String routeEditPath = '/sales/quotations/:id/edit';

  final String? quotationId;

  @override
  ConsumerState<QuotationFormPage> createState() => _QuotationFormPageState();
}

class _QuotationFormPageState extends ConsumerState<QuotationFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _customerCtrl = TextEditingController();
  final TextEditingController _notesCtrl = TextEditingController();
  final TextEditingController _termsCtrl = TextEditingController();

  DateTime? _validUntil;
  bool _saving = false;

  final List<_QuoteLineItem> _items = <_QuoteLineItem>[];

  bool get _isEditing => widget.quotationId != null;

  @override
  void initState() {
    super.initState();
    _validUntil = DateTime.now().add(const Duration(days: 30));
    if (_isEditing) {
      _loadQuotation();
    }
  }

  Future<void> _loadQuotation() async {
    final Quotation? quotation = ref
        .read(quotationDetailProvider(widget.quotationId!))
        .valueOrNull;
    if (quotation != null) {
      _customerCtrl.text = quotation.customerName;
      _notesCtrl.text = quotation.notes ?? '';
      _validUntil = quotation.validUntil;
      for (final QuotationItem item in quotation.items) {
        _items.add(_QuoteLineItem(
          productCtrl: TextEditingController(text: item.productName),
          qtyCtrl: TextEditingController(text: item.quantity.toString()),
          rateCtrl: TextEditingController(text: item.rate.toString()),
        ),);
      }
    }
  }

  @override
  void dispose() {
    _customerCtrl.dispose();
    _notesCtrl.dispose();
    _termsCtrl.dispose();
    for (final _QuoteLineItem item in _items) {
      item.productCtrl.dispose();
      item.qtyCtrl.dispose();
      item.rateCtrl.dispose();
    }
    super.dispose();
  }

  void _addItem() {
    setState(() {
      _items.add(_QuoteLineItem(
        productCtrl: TextEditingController(),
        qtyCtrl: TextEditingController(text: '1'),
        rateCtrl: TextEditingController(),
      ),);
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
    for (final _QuoteLineItem item in _items) {
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
      'validUntil': _validUntil?.toIso8601String(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'terms': _termsCtrl.text.trim().isEmpty ? null : _termsCtrl.text.trim(),
      'items': _items.map((_QuoteLineItem item) => <String, dynamic>{
        'productName': item.productCtrl.text.trim(),
        'quantity': double.tryParse(item.qtyCtrl.text) ?? 1,
        'rate': double.tryParse(item.rateCtrl.text) ?? 0,
        'amount': (double.tryParse(item.qtyCtrl.text) ?? 0) * (double.tryParse(item.rateCtrl.text) ?? 0),
      },).toList(),
      'totalAmount': _totalAmount,
    };

    final Result<Quotation> result = await ref
        .read(quotationsProvider.notifier)
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
        title: Text(_isEditing ? 'Edit Quotation' : 'New Quotation'),
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
                  initialDate: _validUntil ?? DateTime.now().add(const Duration(days: 30)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) setState(() => _validUntil = picked);
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Valid Until',
                  suffixIcon: Icon(Icons.calendar_today_outlined),
                ),
                child: Text(
                  _validUntil != null
                      ? Formatters.date(_validUntil!)
                      : 'Select date',
                ),
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
              (MapEntry<int, _QuoteLineItem> entry) =>
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
                        style: TextStyle(fontWeight: FontWeight.bold),),
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

  Widget _buildItemRow(int index, _QuoteLineItem item) {
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

class _QuoteLineItem {
  _QuoteLineItem({
    required this.productCtrl,
    required this.qtyCtrl,
    required this.rateCtrl,
  });

  final TextEditingController productCtrl;
  final TextEditingController qtyCtrl;
  final TextEditingController rateCtrl;
}
