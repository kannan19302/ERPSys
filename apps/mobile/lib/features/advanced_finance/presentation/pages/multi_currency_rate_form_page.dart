import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/advanced_finance.dart';
import '../providers/advanced_finance_providers.dart';

class MultiCurrencyRateFormPage extends ConsumerStatefulWidget {
  const MultiCurrencyRateFormPage({this.rateId, super.key});

  static const String routeName = 'multi-currency-rate-new';
  static const String routeEditName = 'multi-currency-rate-edit';
  static const String routePath = '/advanced-finance/currency-rates/new';
  static const String routeEditPath = '/advanced-finance/currency-rates/:id/edit';

  final String? rateId;

  @override
  ConsumerState<MultiCurrencyRateFormPage> createState() => _MultiCurrencyRateFormPageState();
}

class _MultiCurrencyRateFormPageState extends ConsumerState<MultiCurrencyRateFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _fromCurrencyCtrl = TextEditingController();
  final TextEditingController _toCurrencyCtrl = TextEditingController();
  final TextEditingController _rateCtrl = TextEditingController();
  final TextEditingController _sourceCtrl = TextEditingController();

  bool _saving = false;

  bool get _isEditing => widget.rateId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadRate();
    }
  }

  Future<void> _loadRate() async {
    final MultiCurrencyRate? rate = ref
        .read(multiCurrencyRateDetailProvider(widget.rateId!))
        .valueOrNull;
    if (rate != null) {
      _fromCurrencyCtrl.text = rate.fromCurrency;
      _toCurrencyCtrl.text = rate.toCurrency;
      _rateCtrl.text = rate.rate.toString();
      _sourceCtrl.text = rate.source ?? '';
    }
  }

  @override
  void dispose() {
    _fromCurrencyCtrl.dispose();
    _toCurrencyCtrl.dispose();
    _rateCtrl.dispose();
    _sourceCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'fromCurrency': _fromCurrencyCtrl.text.trim().toUpperCase(),
      'toCurrency': _toCurrencyCtrl.text.trim().toUpperCase(),
      'rate': double.tryParse(_rateCtrl.text) ?? 0,
      'source': _sourceCtrl.text.trim().isEmpty ? null : _sourceCtrl.text.trim(),
    };

    final Result<MultiCurrencyRate> result = await ref
        .read(multiCurrencyRateListControllerProvider.notifier)
        .save(payload, id: widget.rateId);

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
        title: Text(_isEditing ? 'Edit Currency Rate' : 'New Currency Rate'),
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
              controller: _fromCurrencyCtrl,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'From Currency *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _toCurrencyCtrl,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'To Currency *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _rateCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Rate *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _sourceCtrl,
              decoration: const InputDecoration(
                labelText: 'Source',
                helperText: 'e.g. ECB, Central Bank, MANUAL',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
